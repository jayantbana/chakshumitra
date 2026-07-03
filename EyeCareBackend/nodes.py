import os
import json
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from state import AgentState
from protocol_nodes import PROTOCOLS
from db_mock import fetch_doctors

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

DB_FOLDER = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma(
    persist_directory=DB_FOLDER,
    embedding_function=embedding_function,
    collection_name="medical_docs"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})


# ==========================================
# NODE 1: TRIAGE (INTELLIGENT SUPERVISOR)
# ==========================================
def triage_node(state: AgentState):
    try:
        messages = state["messages"]
        user_msg = messages[-1].content.lower()

        # ── FIX 1: SHORT-CIRCUIT for upload_context ──────────────────
        # If the chat page sent image analysis context, skip ALL routing
        # and go directly to the upload_context_node which uses the LLM
        # to explain the results — never touches ChromaDB RAG.
        upload_ctx = state.get("upload_context")
        if upload_ctx and upload_ctx.get("condition"):
            print(f"🧠 SUPERVISOR: upload_context detected for '{upload_ctx['condition']}'. Routing to upload_context_explanation...")
            return {"intent": "upload_context_explanation"}
        # ─────────────────────────────────────────────────────────────

        # 1. SHORT-CIRCUIT: PROTOCOLS
        active_protocol = state.get("active_protocol")
        if active_protocol:
            print(f"🧠 SUPERVISOR: Active Protocol '{active_protocol}' detected. Continuing...")
            return {"intent": "assessment_protocol"}

        # 2. SHORT-CIRCUIT: IMAGE UPLOADED
        if state.get("uploaded_image_id"):
            print("🧠 SUPERVISOR: Image uploaded. Routing directly to structural vision analysis...")
            return {"intent": "structural_vision_analysis"}

        # 3. SHORT-CIRCUIT: DIAGNOSTIC DATA RECEIVED
        if state.get("functional_test_results"):
            print("🧠 SUPERVISOR: Received Vision SDK data. Routing directly to analysis...")
            return {"intent": "functional_vision_analysis"}

        # 4. LLM-based routing for all other messages
        tools = """
        1. "structural_vision_analysis": Surface-level symptoms (redness, bumps, itching, pink eye, stye).
        2. "functional_vision_analysis": Neurological symptoms (dizziness, double vision, head trauma, pupil reactions).
        3. "medical_advice": General theoretical questions ("What is Glaucoma?") where no visual test is needed.
        4. "find_doctor": User explicitly wants to find a specialist.
        5. "booking": User wants to book an appointment.
        6. "general_chat": Greetings or non-medical topics.
        """

        system_prompt = f"""
        You are the Supervisor AI for a Real-Time Eye Care Agent.

        AVAILABLE TOOLS:
        {tools}

        CRITICAL ROUTING RULES:
        1. Surface/physical symptoms → "structural_vision_analysis"
        2. Neurological/behavioral symptoms → "functional_vision_analysis"
        3. Theoretical questions only → "medical_advice"

        OUTPUT JSON ONLY:
        {{
            "reasoning": "User mentioned feeling dizzy after a fall -> Neurological test needed",
            "next_step": "functional_vision_analysis"
        }}
        """

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_msg)
        ])

        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "")
        elif content.startswith("```"):
            content = content.replace("```", "")

        try:
            decision = json.loads(content)
        except json.JSONDecodeError:
            print(f"❌ JSON Parse Error. Raw content: {content}")
            return {"intent": "general_chat"}

        next_step = decision.get("next_step", "general_chat")
        print(f"🧠 INTELLIGENT ROUTER DECISION: {decision}")

        functional_test_type = None
        if next_step == "functional_vision_analysis":
            if "dizzy" in user_msg or "double" in user_msg:
                functional_test_type = "nystagmus_test"
            else:
                functional_test_type = "plr_test"

        return {
            "intent": next_step,
            "functional_test_type": functional_test_type
        }

    except Exception as e:
        print(f"❌ Triage Error: {e}")
        return {"intent": "general_chat"}


# ==========================================
# NODE 2a: UPLOAD CONTEXT EXPLANATION  ← NEW NODE
# ==========================================
def upload_context_node(state: AgentState):
    """
    Dedicated node for when user comes from the upload page.
    Uses the LLM directly with the image analysis results as context.
    Never touches ChromaDB — the model already has all the data it needs.
    After explaining the diagnosis, it maps the condition to an assessment
    protocol so the graph chains into the 10-question questionnaire.
    """
    try:
        upload_ctx = state.get("upload_context", {})
        messages = state["messages"]
        
        # Get any follow-up question the user typed (after the auto-message)
        user_question = messages[-1].content if messages else ""
        
        condition   = upload_ctx.get("condition", "Unknown condition")
        triage      = upload_ctx.get("triage", "monitor").upper()
        confidence  = upload_ctx.get("confidence", 0)
        findings    = upload_ctx.get("findings", [])
        next_steps  = upload_ctx.get("next_steps", [])

        findings_text   = "\n".join(f"  • {f}" for f in findings)   if findings   else "  • No specific findings recorded"
        next_steps_text = "\n".join(f"  {i+1}. {s}" for i, s in enumerate(next_steps)) if next_steps else "  1. Consult an ophthalmologist"

        # ── Map condition to assessment protocol ──
        condition_lower = condition.lower()
        protocol_map = {
            "conjunctivitis": "conjunctivitis_protocol",
            "pink eye":       "conjunctivitis_protocol",
            "pterygium":      "pterygium_protocol",
            "stye":           "stye_protocol",
            "chalazion":      "stye_protocol",
            "subconjunctival": "sch_protocol",
            "sch":            "sch_protocol",
            "hemorrhage":     "sch_protocol",
        }

        next_protocol = None
        for key, proto in protocol_map.items():
            if key in condition_lower:
                next_protocol = proto
                break

        print(f"🧠 Upload Context: condition='{condition}' → protocol='{next_protocol}'")

        system_prompt = f"""
You are Chakshu Mitra AI, a senior ophthalmic triage assistant.

A patient just had their eye image analyzed. Here are the complete results:

DETECTED CONDITION: {condition}
TRIAGE LEVEL: {triage}
AI CONFIDENCE: {confidence}%

CLINICAL FINDINGS:
{findings_text}

RECOMMENDED NEXT STEPS:
{next_steps_text}

YOUR TASK:
- Briefly explain what "{condition}" means in plain language (2-3 sentences)
- Mention the triage level and what it means
- End by saying: "I need to ask you a few follow-up questions to better assess your condition."
- Keep it concise (under 100 words) — the follow-up questions will come next
- Be warm, professional, and reassuring
- DO NOT say you cannot find information — all the information is provided above
"""

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_question or f"Please explain my {condition} diagnosis results."),
        ])

        return {
            "messages":        [AIMessage(content=response.content)],
            "upload_context":  None,   # ← clear so subsequent messages route normally
            "triage_status":   triage.lower(),
            "active_protocol": next_protocol,
            "protocol_step":   "start" if next_protocol else None,
        }

    except Exception as e:
        print(f"❌ Upload Context Node Error: {e}")
        return {
            "messages": [AIMessage(content="I have your image analysis results. Could you tell me what specifically you'd like to understand about them?")]
        }


# ==========================================
# NODE 2b: MEDICAL ADVICE (RAG System)
# ==========================================
def medical_advice_node(state: AgentState):
    """Generalized RAG Node — only hit for theoretical questions."""
    try:
        messages = state["messages"]
        original_query = messages[-1].content

        if len(messages) > 2:
            print("🤔 Context Analysis: Rewriting query based on history...")
            rephrase_prompt = ChatPromptTemplate.from_messages([
                ("system", "Given a chat history and the latest user question, formulate a standalone question."),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}"),
            ])
            history_window = messages[-6:-1]
            chain = rephrase_prompt | llm | StrOutputParser()
            search_query = chain.invoke({"chat_history": history_window, "question": original_query})
            print(f"🔄 Transformation: '{original_query}' -> '{search_query}'")
        else:
            search_query = original_query

        print(f"🔍 Searching DB for: {search_query}")
        docs = retriever.invoke(search_query)
        context_text = "\n\n".join([doc.page_content for doc in docs])

        if not context_text:
            # ── FALLBACK: Use LLM with conversation history instead of giving up ──
            # This handles follow-up questions about diagnosed conditions where
            # the context exists in chat history, not in the RAG database.
            print("⚠️ RAG returned empty. Falling back to LLM with conversation history...")
            history_window = messages[-8:]  # Last 8 messages for context
            
            fallback_system = """You are Chakshu Mitra AI, an expert ophthalmic assistant.
The user is asking a follow-up question. Use the conversation history to answer.
If the conversation contains a previous diagnosis or image analysis results, use that context to provide a helpful, detailed answer.
Be warm, professional, and empathetic. Never say you cannot find information if the context is available in the conversation history."""
            
            fallback_msgs = [SystemMessage(content=fallback_system)] + list(history_window)
            response = llm.invoke(fallback_msgs)
            return {"messages": [AIMessage(content=response.content)]}

        answer_prompt = ChatPromptTemplate.from_template("""
        You are an expert Ophthalmologist AI. Use the medical context below to answer.

        CONTEXT:
        {context}

        USER QUESTION:
        {question}

        ANSWER:
        """)

        chain = answer_prompt | llm | StrOutputParser()
        response = chain.invoke({"context": context_text, "question": original_query})
        return {"messages": [AIMessage(content=response)]}

    except Exception as e:
        print(f"❌ RAG Error: {e}")
        return {"messages": [AIMessage(content="I'm having trouble accessing my memory right now.")]}


# ── Remaining nodes unchanged ──────────────────────────────────────

def find_doctor_node(state: AgentState):
    user_profile = state.get("user_profile")
    city = user_profile.get("city", "Agra") if user_profile else "Agra"
    condition = state.get("active_protocol") or state.get("detected_condition") or "General Eye Care"

    if condition == "sch_protocol": condition = "Subconjunctival Hemorrhage"
    elif condition == "stye_protocol": condition = "Stye/Chalazion"
    elif condition == "conjunctivitis_protocol": condition = "Conjunctivitis"
    elif condition == "pterygium_protocol": condition = "Pterygium"

    print(f"🔎 Searching doctors in {city} for {condition}...")
    doctors = fetch_doctors(city, condition)

    if not doctors:
        return {"messages": [AIMessage(content=f"I couldn't find any specialists in {city}.")]}

    response_lines = [f"Here are the top specialists in {city} for you:"]
    for doc in doctors:
        specialties = ", ".join(doc['specialties'])
        response_lines.append(
            f"👨‍⚕️ **{doc['name']}** ({doc['clinic']})\n"
            f"   - Specialty: {specialties}\n"
            f"   - Rating: ⭐ {doc['rating']}\n"
            f"   - Next Slot: {doc['next_available']}"
        )
    response_lines.append("\nType 'Book [Doctor Name]' to schedule an appointment.")
    return {"messages": [AIMessage(content="\n\n".join(response_lines))]}


def booking_node(state: AgentState):
    msg = state["messages"][-1].content
    selected_doc = "Dr. Specialist"
    if "Sharma" in msg: selected_doc = "Dr. Aditi Sharma"
    elif "Verma" in msg: selected_doc = "Dr. Rajesh Verma"
    return {"messages": [AIMessage(content=f"✅ **Booking Confirmed!**\n\nAppointment with {selected_doc}\nDate: Tomorrow\nTime: 10:00 AM")]}


def general_chat_node(state: AgentState):
    return {"messages": [AIMessage(content="I am Chakshu Mitra AI. How can I assist you with your eye health today?")]}