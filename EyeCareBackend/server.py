import os
from dotenv import load_dotenv

load_dotenv()

import shutil
import uuid
import asyncio
import logging
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import io
from PIL import Image



# --- PROJECT IMPORTS ---
from main import graph 
from langchain_core.messages import HumanMessage, AIMessage

# Make sure you have created vision_worker.py in the same directory!
from vision_worker import run_diagnostic_agent 

# --- STREAM SDK IMPORT ---
# pip install getstream
from getstream import Stream
from stream_chat import StreamChat  # or getstream SDK

# --- CONFIGURATION ---
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EyeCareAPI")

app = FastAPI(title="Agentic EyeCare API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        # Add your production domain here later
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURE CREDENTIALS ---
STREAM_API_KEY = os.getenv("STREAM_API_KEY", "ysuenp2fxrzh")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "vwtd9zd3er6fnuft94u48eqpzt7vr5gp56uxf8sxzyj3b44aeqzw3dktggr8xftj")
stream_client = Stream(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)

# --- WHATSAPP CONFIGURATION ---
WHATSAPP_API_URL = "https://graph.facebook.com/v19.0"
META_TOKEN = os.getenv("META_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN")

# Debug logging to confirm environment variables loaded
logger.info(f"✅ VERIFY_TOKEN loaded: '{VERIFY_TOKEN}'")
logger.info(f"✅ META_TOKEN loaded: {'SET' if META_TOKEN else 'MISSING ❌'}")
logger.info(f"✅ PHONE_NUMBER_ID loaded: '{PHONE_NUMBER_ID}'")

# --- IN-MEMORY DB FOR WEBHOOKS ---
DIAGNOSTIC_RESULTS_DB: Dict[str, Any] = {}

_diagnostic_store: dict = {}

# In-memory thread store (WhatsApp number → thread_id)
# Each user gets their own persistent LangGraph thread
whatsapp_threads: dict[str, str] = {}

# ==========================================
# REQUEST & RESPONSE MODELS
# ==========================================
class ChatRequest(BaseModel):
    user_id: str
    thread_id: str
    message: Optional[str] = None
    image_id: Optional[str] = None 
    upload_context: Optional[Dict[str, Any]] = None
    functional_test_results: Optional[Dict[str, Any]] = None
    functional_test_type: Optional[str] = None 

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    active_protocol: Optional[str] = None
    triage_status: Optional[str] = None
    video_stream_active: Optional[bool] = False
    call_id: Optional[str] = None

class AgentWebhookPayload(BaseModel):
    call_id: str
    test_type: str
    results: Dict[str, Any]

# ==========================================
# 1. LANGGRAPH CHAT ENDPOINT
# ==========================================
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        inputs = {}
        
        if request.message:
            inputs["messages"] = [HumanMessage(content=request.message)]
        
        if request.image_id:
            inputs["uploaded_image_id"] = request.image_id
            inputs["ai_prediction"] = None   
            inputs["active_protocol"] = None 
            inputs["protocol_step"] = None   
            if not request.message:
                inputs["messages"] = [HumanMessage(content="[User uploaded a static image for eye analysis]")]
        else:
            # BUG FIX: Clear uploaded_image_id so it doesn't persist in LangGraph memory
            # and cause ALL future text messages to re-route to structural_vision_analysis.
            inputs["uploaded_image_id"] = None

        if request.upload_context:
            inputs["upload_context"] = request.upload_context

        if request.functional_test_results:
            inputs["functional_test_results"] = request.functional_test_results
            if not request.message:
                test_name = request.functional_test_type or "video"
                inputs["messages"] = [HumanMessage(content=f"[Vision SDK completed {test_name} scan and returned data]")]
        else:
            # Clear functional test state between turns
            inputs["functional_test_results"] = None
            inputs["functional_test_type"] = None
        
        if request.functional_test_type:
            inputs["functional_test_type"] = request.functional_test_type

        config = {"configurable": {"thread_id": request.thread_id}}
        output = graph.invoke(inputs, config=config)
        
        # Robust Response Extraction
        all_messages = output["messages"]
        bot_responses = []
        last_human_idx = -1
        for i in range(len(all_messages) - 1, -1, -1):
            if isinstance(all_messages[i], HumanMessage):
                last_human_idx = i
                break
        
        if last_human_idx != -1:
            for msg in all_messages[last_human_idx+1:]:
                if isinstance(msg, AIMessage) and msg.content.strip():
                    bot_responses.append(msg.content)
        
        if not bot_responses and len(all_messages) > 0:
            last_msg = all_messages[-1]
            if isinstance(last_msg, AIMessage) and last_msg.content.strip():
                bot_responses.append(last_msg.content)

        full_response = "\n\n".join(bot_responses) or "I processed your data. Please tell me if you have any other symptoms."

        thread_id = request.thread_id
        call_id = f"result-{thread_id}"
        
        # BUG FIX: triage_status must come from state, not from "intent" (which is the routing label).
        # output.get("intent") returns values like "structural_vision_analysis" which are not valid
        # triage strings and would crash the frontend triageConfig lookup.
        active_protocol = output.get("active_protocol")
        ai_prediction = output.get("ai_prediction")
        
        # Derive a meaningful triage status from the AI prediction confidence
        raw_triage = None
        if ai_prediction:
            detected_class = ai_prediction.get("class", "healthy")
            confidence = ai_prediction.get("confidence", 0)
            if detected_class == "healthy":
                raw_triage = "normal"
            elif confidence > 0.8:
                raw_triage = "urgent"
            else:
                raw_triage = "monitor"
        
        valid_triage_values = {"normal", "monitor", "urgent", "emergency"}
        triage_status = raw_triage if raw_triage in valid_triage_values else "monitor"
        
        _diagnostic_store[call_id] = {
            "call_id": call_id,
            "condition": active_protocol or (ai_prediction.get("class") if ai_prediction else None) or "Clinical Eye Scan Analysis",
            "triage_status": triage_status,
            "recommendation": full_response,
            "confidence": ai_prediction.get("confidence", 0.85) if ai_prediction else 0.85,
        }

        return {
            "response": full_response,
            "thread_id": thread_id,
            "active_protocol": active_protocol,
            "triage_status": triage_status,
            "video_stream_active": output.get("video_stream_active", False),
            "call_id": call_id,
        }
    except Exception as e:
        logger.error(f"Graph execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 2. STREAM VIDEO TOKEN GENERATOR
# ==========================================
def launch_agent_task(call_id: str, test_type: str):
    """Wrapper to run the async agent in a background thread."""
    asyncio.run(run_diagnostic_agent(call_id, test_type))

@app.post("/generate-video-token")
async def generate_video_token(payload: dict):
    user_id = str(payload.get("user_id", "guest"))  # MUST be a string

    client = StreamChat(
        api_key=os.getenv("STREAM_API_KEY"),
        api_secret=os.getenv("STREAM_API_SECRET"),
    )

    # Token MUST be generated with the EXACT same user_id string
    token = client.create_token(user_id)
    channel_name = f"diagnostic-{user_id[:8]}"

    return {
        "token": token,
        "channel_name": channel_name,
        "uid": user_id,  # Return the string, not a number
    }

# ==========================================
# 3. PYTHON AGENT WEBHOOK & REACT POLLING
# ==========================================
@app.post("/agent-webhook")
async def receive_agent_data(payload: AgentWebhookPayload):
    print(f"📥 Received ultra-low latency data for Room: {payload.call_id}")
    DIAGNOSTIC_RESULTS_DB[payload.call_id] = payload.results
    return {"status": "success", "message": "Telemetry received."}

@app.get("/diagnostic-results/{call_id}")
async def get_diagnostic_results(call_id: str):
    result = _diagnostic_store.get(call_id)
    if not result:
        return {
            "call_id": call_id,
            "condition": None,
            "triage_status": None,
            "recommendation": None,
        }
    return result

@app.post("/store-result/{call_id}")
async def store_diagnostic_result(call_id: str, data: dict):
    _diagnostic_store[call_id] = data
    return {"stored": True}

# ==========================================
# 4. STATIC IMAGE UPLOAD
#    FIX: Returns absolute path so vision_nodes.py can always find the file.
#    FIX: Renamed function to avoid collision with /upload-image handler.
# ==========================================
@app.post("/upload")
async def upload_static_image(file: UploadFile = File(...)):
    try:
        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
        if file.content_type and file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
        file_extension = (file.filename or "image.jpg").split(".")[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Use absolute path so vision_nodes can find the file regardless of CWD
        abs_upload_dir = os.path.abspath(UPLOAD_DIR)
        os.makedirs(abs_upload_dir, exist_ok=True)
        file_path = os.path.join(abs_upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"✅ Image uploaded successfully: {file_path}")
        return {"image_id": file_path, "message": "Image uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Image upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

# ==========================================
# 5. FUNDUS / UPLOAD-IMAGE ENDPOINT
#    Renamed from upload_image to avoid Python function collision with /upload.
# ==========================================
@app.post("/upload-image")
async def upload_fundus_image(
    file: UploadFile = File(...),
    eye: str = Form(default="right"),
    context: str = Form(default="")
):
    try:
        contents = await file.read()
        from vision_worker import analyze_fundus_image
        result = await analyze_fundus_image(
            image_bytes=contents,
            eye=eye,
            context=context
        )
        return result
    except Exception as e:
        logger.error(f"❌ Fundus image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@app.get("/")
def root():
    return {"status": "running", "service": "Agentic EyeCare Backend v3.0"}

# health check endpoint to verify server is running 

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Chakshu Mitra API"}


# ==========================================
# WHATSAPP: HELPER FUNCTIONS
# ==========================================
def get_thread_id(wa_number: str) -> str:
    """Get or create a persistent thread ID for a WhatsApp user."""
    if wa_number not in whatsapp_threads:
        whatsapp_threads[wa_number] = f"wa-{wa_number}"
    return whatsapp_threads[wa_number]


async def send_whatsapp_message(to: str, text: str):
    """Send a message via Meta WhatsApp API."""
    url = f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {META_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(f"❌ Meta API error: {resp.text}")
    except Exception as e:
        logger.error(f"❌ Failed to send WhatsApp message to {to}: {e}")


async def process_and_reply(wa_number: str, user_text: str, thread_id: str):
    """Process user message through LangGraph and send AI response via WhatsApp."""
    try:
        # 1. Run LangGraph (same as /chat endpoint)
        inputs = {"messages": [HumanMessage(content=user_text)]}
        config = {"configurable": {"thread_id": thread_id}}
        output = graph.invoke(inputs, config=config)

        # 2. Extract AI response (same logic as /chat)
        all_messages = output["messages"]
        bot_responses = []
        last_human_idx = -1
        for i in range(len(all_messages) - 1, -1, -1):
            if isinstance(all_messages[i], HumanMessage):
                last_human_idx = i
                break
        
        if last_human_idx != -1:
            for msg in all_messages[last_human_idx + 1:]:
                if isinstance(msg, AIMessage) and msg.content.strip():
                    bot_responses.append(msg.content)

        reply = "\n\n".join(bot_responses) or "I'm here to help. Could you describe your symptoms?"

        # 3. WhatsApp has 4096 char limit — split if needed
        chunks = [reply[i:i+4000] for i in range(0, len(reply), 4000)]
        for chunk in chunks:
            await send_whatsapp_message(wa_number, chunk)

    except Exception as e:
        logger.error(f"❌ WhatsApp process error: {e}")
        await send_whatsapp_message(wa_number, "I'm having trouble right now. Please try again in a moment.")


# ==========================================
# WHATSAPP: WEBHOOK VERIFICATION (GET)
# ==========================================
@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
):
    """Verify WhatsApp webhook for initial setup."""
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


# ==========================================
# WHATSAPP: RECEIVE MESSAGES (POST)
# ==========================================
@app.post("/webhook")
async def receive_whatsapp(request: Request, background_tasks: BackgroundTasks):
    """Receive incoming WhatsApp messages and process them."""
    body = await request.json()

    try:
        entry = body["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]

        # Ignore status updates (delivered, read, etc.)
        if "messages" not in value:
            return {"status": "ignored"}

        msg = value["messages"][0]
        wa_number = msg["from"]  # e.g. "919876543210"
        msg_type = msg.get("type", "")

        # Only handle text messages for now
        if msg_type != "text":
            await send_whatsapp_message(
                wa_number,
                "Sorry, I can only process text messages right now. Please describe your symptoms in text."
            )
            return {"status": "ok"}

        user_text = msg["text"]["body"]
        thread_id = get_thread_id(wa_number)

        # Process in background so Meta doesn't timeout
        background_tasks.add_task(
            process_and_reply, wa_number, user_text, thread_id
        )

    except (KeyError, IndexError) as e:
        logger.warning(f"Webhook parse error: {e} — body: {body}")

    # Always return 200 immediately to Meta
    return {"status": "ok"}