# Chakshu Mitra: Deep Technical Architecture & System Documentation

Chakshu Mitra is an advanced, high-fidelity AI-powered ophthalmic screening and triage platform. The system integrates real-time conversational agents, state-of-the-art computer vision models, retrieval-augmented generation (RAG) databases, and external hardware/WebRTC integrations to provide immediate, clinical-grade triage guidance.

This document offers a comprehensive, step-by-step deep dive into the engineering, machine learning models, state machine routing, API structures, frontend flows, and networking configurations that power the application.

---

## 1. Complete Technology Stack

Chakshu Mitra is built using a modern, split-architecture stack designed for high throughput, low latency, and deterministic state routing.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│   Next.js 16 (App Router)  │ React 19 │ TypeScript │ Tailwind CSS      │
│   Zustand (Global State)   │ Axios │ Framer Motion │ Stream Video SDK  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSockets / WebRTC
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                   │
│   FastAPI (Asynchronous REST) │ Uvicorn │ Python 3.11                  │
│   LangGraph (Stateful Agent Router) │ LangChain Core                   │
│   PyTorch (Vision Inference) │ TIMM (PyTorch Image Models)              │
│   ChromaDB (Vector Vectorstore) │ HuggingFace Embeddings               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ External APIs / Tunnels
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE & INTEGRATIONS                     │
│   Nginx (Reverse Proxy) │ Ngrok (Secure Tunneling)                    │
│   Meta WhatsApp Business API (Webhooks & Messaging)                    │
│   GetStream (WebRTC Video Streaming & Telemetry)                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture
*   **Framework**: Next.js 16 (using React 19) leverages the App Router structure for routing, static page generation, and optimized server/client component splitting.
*   **Styling**: Custom CSS and utility-first styling via Tailwind CSS, with fluid animations built using Framer Motion to create smooth transitions in the chatbot interface and camera scanning scopes.
*   **State Management**: Zustand stores are used to manage global state:
    *   `useSessionStore`: Manages user identities, persistent LangGraph thread IDs, diagnostic results, active questionnaire states, and video tokens.
    *   `useChatStore`: Controls the local message lists, API request loading indicators, and active conversation contexts.
*   **API Client**: Axios manages communication with the FastAPI backend, utilizing a custom instance config with an elevated timeout (120 seconds) to handle slower CPU-bound Vision Transformer execution times in environments lacking dedicated GPUs.
*   **Video Integration**: `@stream-io/video-react-sdk` manages WebRTC streams for camera capturing and live eye analysis.

### Backend Architecture
*   **API Framework**: FastAPI provides high-performance, asynchronous endpoints built on Starlette and Pydantic for request payload validation.
*   **Server**: Uvicorn acts as the ASGI web server, handling concurrent network requests via an event-loop structure.
*   **Orchestration Engine**: LangGraph coordinates complex stateful agents, turning LLMs, RAG engines, PyTorch models, and questionnaires into a deterministic state-machine graph.
*   **Retrieval-Augmented Generation (RAG)**: LangChain framework with HuggingFace embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and ChromaDB vector store.
*   **Deep Learning Inference**: PyTorch, torchvision, and `timm` (Pytorch Image Models) run structural classification inference on uploaded eye frames.

---

## 2. Core Machine Learning Models & Deep Explanations

Chakshu Mitra combines vision and natural language processing models to perform diagnostics and coordinate patient triage.

### A. Vision Transformer (ViT) for Structural Analysis
The key visual model used for eye surface diagnostics is a **Vision Transformer (ViT)** classifier. Specifically, it uses the `vit_base_patch16_224` architecture provided by the `timm` library.

#### Model Architecture Details
*   **Input Dimensions**: $3 \times 224 \times 224$ (RGB image resized to $224 \times 224$ pixels).
*   **Patch Projection**: The standard Convolutional neural network approach of pixel-by-pixel convolution is replaced. The $224 \times 224$ image is divided into a grid of non-overlapping patches of size $16 \times 16$ pixels.
    $$\text{Number of patches } (N) = \frac{224}{16} \times \frac{224}{16} = 14 \times 14 = 196$$
    Each patch is flattened into a vector of size $16 \times 16 \times 3 = 768$. These vectors are mapped through a linear projection layer to a $D$-dimensional hidden vector ($D = 768$ for ViT-Base).
*   **Classification (CLS) Token**: A learnable parameter embedding (the CLS token) is prepended to the patch sequence. As it passes through the self-attention blocks, the CLS token aggregates features across all patches, acting as the global representation of the image.
*   **Positional Embeddings**: Because transformers do not have built-in spatial awareness, 1D learnable positional embeddings are added to the patch vectors to preserve spatial coordinate details.
*   **Transformer Encoder Blocks**: The sequence of $197$ vectors (196 patches + 1 CLS token) is processed through 12 layers of Encoder blocks. Each block consists of:
    *   **Multi-Head Self-Attention (MSA)**: Computes attention scores between patches, allowing the model to correlate distant regions of the eye (e.g., matching the sclera redness on both sides of the iris).
        $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
    *   **Multi-Layer Perceptron (MLP)**: Two linear layers with a GELU activation function.
    *   **Layer Normalization (LN)** and **Residual Connections** before and after each sub-layer to stabilize gradient flow.
*   **Custom Classification Head**: The standard pre-trained ImageNet head is replaced with a custom neural network sequence configured for our specific clinical classes:
    ```python
    model.head = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(model.head.in_features, NUM_CLASSES) # NUM_CLASSES = 4
    )
    ```
    The dropout layer ($p = 0.5$) mitigates overfitting by randomly disabling nodes during training.

#### Diagnostic Classes
The model is trained to classify eye images into one of four clinical categories:
1.  `healthy`: Normal, clear sclera and cornea without inflammation or growths.
2.  `pterygium`: A benign, triangular fleshy growth starting on the conjunctiva and extending onto the cornea.
3.  `conjunctivitis`: Diffuse vascular congestion and inflammation of the conjunctiva (pink eye).
4.  `pinguecula`: A raised, yellow-white deposit on the sclera, typically adjacent to the cornea (nasal side).

#### Model Code Implementation (`model_inference.py` / `vision_nodes.py`)
```python
def create_vit():
    model = timm.create_model("vit_base_patch16_224", pretrained=False)
    model.head = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(model.head.in_features, NUM_CLASSES)
    )
    return model
```
In `vision_nodes.py`, the weights from `best_vit_base_4class.pth` are loaded into memory on startup. Images are preprocessed using:
```python
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) # ImageNet normalization constants
])
```

---

### B. Large Language Model (LLM) Orchestration
The primary text model is **`llama-3.3-70b-versatile`**, hosted on the Groq Cloud API.

#### Roles of the LLM
1.  **Intelligent Supervisor (Triage Node)**: Reads user conversation logs, determines user intent, and returns a structured JSON routing decision to LangGraph.
2.  **RAG Medical Context Interpreter**: Reads retrieved markdown text from the Chroma DB and translates it into patient-facing advice.
3.  **Diagnosis Explainer (Upload Context Node)**: Takes raw output parameters from the ViT model (condition, confidence, findings, next steps) and explains them in a natural, empathetic tone.
4.  **Report Synthesizer**: After a user finishes a 10-question symptom questionnaire, the LLM aggregates the conversation history and generates a structured medical triage report detailing findings and clinical recommendations.

---

### C. Embedding Model & Vector Space
The database ingestion script (`ingest.py`) parses documents like *Pterygium notes*, *Stye Chalazion Guides*, and *Subconjunctival Hemorrhage guidelines*.
*   **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` maps text chunks into a 384-dimensional vector space.
*   **Vector Database**: ChromaDB stores document vectors.
*   **Query Processing**: When a user asks theoretical questions (e.g., *"What causes a stye?"*), the query is transformed into a 384-dimensional vector, and a cosine-similarity search retrieves the $k=4$ most relevant text blocks to form the LLM's prompt context.

---

## 3. LangGraph Stateful Routing Architecture ("Nodes")

The heart of Chakshu Mitra's logical execution is a state graph constructed via **LangGraph**. Unlike standard linear chain pipelines, LangGraph allows for cyclic execution flows (loops), enabling the chatbot to ask follow-up questions, handle multi-turn conversations, and transition between modes.

```
                       ┌───────── START ─────────┐
                       │                         │
                       ▼                         │
               ┌───────────────┐                 │
               │ load_context  │                 │
               └───────┬───────┘                 │
                       ▼                         │
               ┌───────────────┐                 │
               │    triage     │                 │
               └───────┬───────┘                 │
                       │                         │
                       │ Main Router             │
                       ├─────────────────────────┼────────────────────────┐
                       │                         │                        │
                       ▼                         ▼                        ▼
         ┌─────────────────────────┐   ┌───────────────────┐   ┌─────────────────────┐
         │upload_context_explain   │   │  structural_vision│   │  functional_vision  │
         └─────────────┬───────────┘   └─────────┬─────────┘   └──────────┬──────────┘
                       │                         │                        │
                       └─────────────────────────┼────────────────────────┘
                                                 │
                                                 ▼
                                           Vision Router
                                                 │
                                                 ├────────────────────────┐
                                                 │                        │
                                                 ▼                        ▼
                                       ┌───────────────────┐            ┌───┐
                                       │assessment_protocol│            │END│
                                       └─────────┬─────────┘            └───┘
                                                 │
                                                 ▼
                                               ┌───┐
                                               │END│
                                               └───┘
```

### The State Schema (`state.py`)
The state of the conversation is preserved in `AgentState`, a typed dictionary defined as:
```python
class AgentState(TypedDict):
    messages: Annotated[List[AnyMessage], add_messages] # Appends new chat turns automatically
    user_profile: Optional[UserProfile]                 # Patient metadata (Age, Gender, City)
    vision_test_results: Optional[VisionTestResults]     # Historical vision parameters
    uploaded_image_id: Optional[str]                     # Path of uploaded eye image
    video_stream_active: Optional[bool]                  # Flag indicating WebRTC camera active
    functional_test_type: Optional[str]                  # e.g., "plr_test" or "nystagmus_test"
    functional_test_results: Optional[Dict[str, Any]]    # Raw metrics (pupil latency, etc.)
    ai_prediction: Optional[Dict[str, Any]]             # ViT output: {"class": "pterygium", "confidence": 0.98}
    active_protocol: Optional[str]                      # Active questionnaire track
    protocol_step: Optional[str]                        # Steps in active questionnaire
    assessment_data: Optional[Dict[str, Any]]            # Stored survey answers
    upload_context: Optional[Dict[str, Any]]            # Image parameters received from Frontend upload
    intent: Optional[str]                               # Supervisor routing selection
    detected_condition: Optional[str]                   # Output diagnosis string
    selected_doctor_id: Optional[int]                   # Doctor identification variable
```

---

### Deep Explanation of Nodes & Router Functions

#### 1. Ingestion Node (`load_context`)
*   **Purpose**: Runs at the beginning of every graph invocation.
*   **Logic**: Checks if `user_profile` exists in state. If empty, queries `db_mock.py` to retrieve the active user profile (name, age, city) and historical vision metrics (distance acuity, astigmatism, color-blindness flags) to inject into the graph context.

#### 2. Decision Node (`triage`)
*   **Purpose**: The central dispatcher of the system.
*   **Logic**:
    1.  **Short-Circuit Checks**:
        *   If `upload_context` containing a diagnosed condition is present in state (passed from the image upload screen), bypasses routing and returns `{"intent": "upload_context_explanation"}`.
        *   If `active_protocol` is active, routes directly to the `assessment_protocol` node to continue the questionnaire.
        *   If `uploaded_image_id` is set (new image upload from chat), routes directly to `structural_vision_analysis`.
        *   If `functional_test_results` are provided (WebRTC video metrics received), routes directly to `functional_vision_analysis`.
    2.  **LLM Intent Classifier**: If no short-circuits trigger, calls Llama 3.3 with a routing prompt specifying all tools:
        *   `structural_vision_analysis`: For surface eye symptoms.
        *   `functional_vision_analysis`: For neurological/movement issues.
        *   `medical_advice`: For theoretical queries.
        *   `find_doctor` / `booking`: To locate and schedule specialists.
        *   `general_chat`: Greeting fallbacks.
        The LLM yields a JSON string containing the next node name, which is parsed and returned as `intent`.

#### 3. Upload Explainer Node (`upload_context_explanation`)
*   **Purpose**: Explains results generated from the upload page.
*   **Logic**:
    1.  Extracts the pre-analyzed conditions, findings, and triage flags from `upload_context`.
    2.  Maps the condition name to its corresponding questionnaire protocol (e.g., *"conjunctivitis"* maps to `conjunctivitis_protocol`).
    3.  Calls the LLM to format a conversational, empathetic message explaining the findings, ending with a prompt indicating that follow-up questions will begin.
    4.  Clears the `upload_context` object from the state so future messages do not re-trigger this node, and sets the state's `active_protocol` and `protocol_step` to `"start"`.

#### 4. Image Processor Node (`structural_vision_analysis`)
*   **Purpose**: Run local vision inference on uploaded static frames.
*   **Logic**:
    1.  Retrieves `uploaded_image_id` (a filesystem path).
    2.  Preprocesses the image through the custom torchvision transform pipeline and feeds it into the custom-head ViT model.
    3.  Evaluates prediction class index and softmax confidence score.
    4.  Maps the resulting class label to the corresponding follow-up protocol.
    5.  Passes the predicted class and confidence to the LLM to generate a doctor-style message explaining the surface scan results, and flags the graph to transition to the assessment protocol.

#### 5. Video Data Analyst Node (`functional_vision_analysis`)
*   **Purpose**: Analyzes WebRTC camera video telemetry.
*   **Logic**:
    1.  Checks if `functional_test_results` exist in the state.
    2.  **No Results**: Sets `video_stream_active: True` and returns instructions telling the frontend to activate the video camera stream.
    3.  **Results Present**: Takes the raw physics parameters (e.g., pupillary reaction times, movement stutters) and prompts Llama 3.3 to compile a neuro-ophthalmologist report. It then routes the patient to a `neurology_protocol` survey.

#### 6. Questionnaire Engine Node (`assessment_protocol`)
*   **Purpose**: Conducts the interactive clinical risk assessment.
*   **Logic**:
    1.  Retrieves the active protocol's question database from `PROTOCOL_NODES` inside `protocol_nodes.py`.
    2.  Loads the current step pointer (index `0` to `9`).
    3.  If the pointer is within bounds, returns the next question text prefixed with `**Follow-up Question (X/10)**` and increments the pointer.
    4.  If the pointer exceeds the question list size, the survey is complete. The node retrieves the entire message log containing all Q&A pairs, passes them to Llama 3.3 to write a synthesized triage diagnosis report (avoiding repeating raw questions and answers), and resets the active protocol states.

#### 7. Knowledge Retriever Node (`medical_advice`)
*   **Purpose**: Resolves educational and theoretical inquiries.
*   **Logic**:
    1.  **Query Rephrasing**: If the conversation is multi-turn, calls Llama 3.3 to rephrase the latest query into a standalone search term based on historical chat messages.
    2.  **Vector Store Search**: Queries ChromaDB using the search term.
    3.  **Context Assembly**: If documents are found, formats them into a prompt and calls Llama 3.3 to generate an authoritative, RAG-backed response.
    4.  **Fallback Path**: If the vector database returns empty, the model falls back to evaluating the chat history to address questions regarding previous diagnoses or image analyses.

#### 8. Medical Directories Nodes (`find_doctor` & `booking`)
*   **Purpose**: Connects patients with regional medical practitioners.
*   **Logic**:
    *   `find_doctor`: Inspects the patient's `city` profile metadata. Filters the mock database (`db_mock.py`) for matching clinics, prioritizes doctors by matching specializations to the active protocol flags, and returns a formatted list of specialists.
    *   `booking`: Evaluates response strings for name matches (e.g., *"Aditi Sharma"*) and triggers a mock database booking, returning appointment details.

---

### Router Routing Mechanisms (`main.py`)
LangGraph implements two routing checkpoints to direct state execution:

1.  **`main_router`**: Evaluates the `intent` string set by the `triage` supervisor node and routes execution to the matching node.
2.  **`vision_router`**: Placed after `structural_vision_analysis`, `functional_vision_analysis`, and `upload_context_explanation`. It checks if `active_protocol` is configured. If true, routes to `assessment_protocol` immediately. If false, terminates the flow (`END`).

---

## 4. Detailed Questionnaire Protocols

The application uses standard triage questionnaires containing specific questions designed to assess the severity of a patient's condition.

### 1. Conjunctivitis (Pink Eye) Protocol
*   `Do you have sticky yellow or green discharge?` (Differentiates bacterial from viral/allergic)
*   `Is there a gritty sensation (like sand in your eye)?`
*   `Are your eyelids stuck together when you wake up?` (Strong indicator of bacterial infection)
*   `Is the redness in one eye or both?`
*   `Are you experiencing any itching or burning sensation?` (Allergic indicator)
*   `Do you have excessive tearing or watery eyes?`
*   `Are you experiencing any sensitivity to light (photophobia)?` (Light sensitivity is a warning sign)
*   `Have you recently had a cold, or been around anyone else with pink eye?` (Viral transmission)
*   `Do you currently wear contact lenses?` (High risk for corneal ulcers)
*   `Are you experiencing any blurriness or decrease in your actual vision?` (Red flag warning sign)

### 2. Subconjunctival Hemorrhage (SCH) Protocol
*   `Did this red spot appear after coughing, sneezing, vomiting, or heavy lifting?` (Valsalva trigger)
*   `Are you experiencing any actual pain (other than a mild scratchy feeling)?` (True pain indicates alternate disease)
*   `Are you currently taking any blood thinners or aspirin?` (Bleeding risk factor)
*   `Did you experience any recent trauma, injury, or poke to the eye?`
*   `Do you have a history of high blood pressure?`
*   `Is the red patch affecting or blocking your vision in any way?`
*   `Is there any discharge, crusting, or stickiness accompanying the redness?` (Differentiates from conjunctivitis)
*   `Do you have a habit of rubbing your eyes vigorously?`
*   `Has this sudden redness happened to you before?` (Recurrent checks)
*   `Is the red spot actively growing larger, or staying about the same size?`

### 3. Pterygium Protocol
*   `Do you spend a lot of time outdoors in the sun, wind, or dusty environments?` (UV/dust etiology)
*   `Is the fleshy growth extending toward the center of your eye and interfering with your vision?` (Surgical trigger)
*   `Does it feel like there is a foreign object stuck in your eye?`
*   `Is the eye frequently red, irritated, or inflamed?`
*   `Do your eyes feel exceptionally dry or itchy on a regular basis?`
*   `Has this growth noticeably changed in size or shape recently?` (Aggressive progression risk)
*   `Do you regularly wear UV-protective sunglasses when outside?`
*   `Are you experiencing any double vision or astigmatism symptoms?` (Corneal distortion risk)
*   `Approximately how long ago did you first notice this growth?`
*   `Does the area cause a burning sensation, especially after being outdoors?`

### 4. Stye (Hordeolum / Chalazion) Protocol
*   `Is there a specific, painful lump or bump on the edge of your eyelid?`
*   `How many days has this bump been present?` (Differentiates acute stye from chronic chalazion)
*   `Does your entire eyelid feel swollen and heavy?`
*   `Is there a visible white or yellow 'head' (like a pimple) at the center of the bump?`
*   `Is the lump extremely sensitive or tender when you touch it?`
*   `Are you experiencing increased tearing or crustiness along the lash line?`
*   `Is the swelling severe enough that it is affecting your ability to see clearly?`
*   `Have you been applying warm compresses to the area yet?` (Baseline home care verification)
*   `Have you had styes or similar eyelid issues in the past?`
*   `Do you regularly wear eye makeup, or sleep without removing it?` (Clogged meibomian gland source)

### 5. Neurology Protocol (PLR / Nystagmus Follow-up)
*   `Have you recently experienced any head trauma, falls, or direct impact to your head?` (Concussion screening)
*   `Are you feeling dizzy, lightheaded, or experiencing a spinning sensation (vertigo)?`
*   `Are you experiencing any double vision, or blurry vision that changes when you move your head?`
*   `Have you felt nauseous or vomited since these symptoms started?` (Increased intracranial pressure sign)
*   `Are you currently taking any new medications, antihistamines, or substances that might affect your pupils?`
*   `Do you have a severe headache or extreme sensitivity to light right now?`
*   `Have you noticed any weakness, numbness, or tingling in your face, arms, or legs?` (Stroke screening)
*   `Is there a history of migraines, strokes, or neurological conditions in your family?`

---

## 5. Infrastructure & Networking Stack

To connect the Next.js client application, the FastAPI engine, and external platforms (like the Meta Webhook servers and WebRTC streams), Chakshu Mitra employs a configured infrastructure layer.

```
                  ┌───────────────────────────────┐
                  │      Meta WhatsApp API        │
                  │   (Incoming user messages)    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼ HTTPS POST
                          ┌──────────────┐
                          │  Ngrok URL   │
                          └──────┬───────┘
                                 │ Forward
                                 ▼
                         ┌───────────────┐
                         │  Nginx (80)   │
                         └───────┬───────┘
                                 │ proxy_pass
                                 ▼
                         ┌───────────────┐
                         │ FastAPI (8000)│
                         └───────────────┘
```

### Nginx (Production Reverse Proxy)
In production deployment environments, Nginx sits in front of the application processes to act as a reverse proxy.

#### Core Nginx Configurations
1.  **SSL Termination**: Nginx intercepts port `443` HTTPS connections, decrypts the incoming packets using Let's Encrypt certificates, and forwards the decapsulated HTTP packets to internal local processes. This shields application instances from SSL handshake processing overhead.
2.  **Port Allocation Routing**:
    *   Web HTTP traffic targeting `/` or frontend assets is directed to `http://127.0.0.1:3000` (Next.js server).
    *   API traffic targeting `/api` or `/chat` paths is rewritten and passed to `http://127.0.0.1:8000` (FastAPI backend).
3.  **Static File Caching**: Nginx serves static client images, styles, and compiled frontend scripts directly from the disk.

Example configuration snippet:
```nginx
server {
    listen 80;
    server_name chakshumitra.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Ngrok (Local Tunneling & Callback Routing)
During development and hackathon deployments, Nginx config changes are bypassed using **Ngrok** to create secure public tunnels.

#### The Role of Ngrok
*   **Locally Exposed Endpoints**: FastAPI runs on `localhost:8000`. However, Meta's servers cannot send webhooks to local IP addresses. Ngrok opens a secure tunnel from a public address (e.g., `https://xxxx.ngrok-free.app`) directly to the local port `8000`.
*   **WebRTC Signaling & Telemetry**: Allows remote client devices running the camera scan scripts to post frames and telemetry payloads directly back to the active API server instance.

---

### Meta WhatsApp Integration Loop
The backend includes a fully integrated WhatsApp channel in `server.py` that allows patients to interact with the triage graph directly from their phones.

#### 1. Webhook Verification Loop
When registering the webhook in the Meta Developer Console, Meta sends a `GET` request to verify the server's authenticity.
*   **Endpoint**: `/webhook`
*   **Process**:
    ```python
    @app.get("/webhook")
    async def verify_webhook(
        hub_mode: str = Query(alias="hub.mode", default=""),
        hub_challenge: str = Query(alias="hub.challenge", default=""),
        hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    ):
        if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
            return PlainTextResponse(content=hub_challenge)
        raise HTTPException(status_code=403, detail="Verification failed")
    ```
    The endpoint intercepts Meta's challenge, verifies that the `hub_verify_token` matches our local environment variable (`VERIFY_TOKEN`), and returns the `hub_challenge` raw string to confirm verification.

#### 2. Message Webhook Listener (Incoming User Message)
*   **Endpoint**: `POST /webhook`
*   **Process**:
    1.  Receives JSON payloads containing messages sent by users to the registered WhatsApp Business number.
    2.  Extracts the sender's phone number (`wa_number = msg["from"]`) and message type.
    3.  If the incoming message is not a text payload, responds with a template message indicating that only text descriptions are supported over the WhatsApp channel.
    4.  Retrieves or creates a unique session thread ID for the sender:
        ```python
        def get_thread_id(wa_number: str) -> str:
            if wa_number not in whatsapp_threads:
                whatsapp_threads[wa_number] = f"wa-{wa_number}"
            return whatsapp_threads[wa_number]
        ```
    5.  **Non-Blocking Processing**: To prevent Meta from timing out the webhook (which requires a `200 OK` response within 3 seconds), the processing logic is added to a FastAPI `BackgroundTasks` queue.
        ```python
        background_tasks.add_task(process_and_reply, wa_number, user_text, thread_id)
        ```
    6.  Returns `{"status": "ok"}` to Meta immediately.

#### 3. Graph Execution & Reply Send Loop
*   **Process**:
    1.  Invokes the LangGraph instance using the persistent thread configuration:
        ```python
        config = {"configurable": {"thread_id": thread_id}}
        output = graph.invoke({"messages": [HumanMessage(content=user_text)]}, config=config)
        ```
    2.  Extracts the latest `AIMessage` returned by the graph.
    3.  Enforces character length limits. If the message exceeds Meta's 4096-character text limits, splits the text into chunks of 4000 characters.
    4.  Calls the Meta Graph API message endpoint to deliver the message back to the user:
        ```python
        async def send_whatsapp_message(to: str, text: str):
            url = f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"
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
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload, headers=headers)
        ```

---

## 6. End-to-End Walkthrough of Key User Journeys

### Journey A: Static Image Upload & Discussion
```
[React Client]                           [FastAPI Server]               [PyTorch ViT]          [Llama 3.3 LLM]
      │                                         │                             │                       │
      │── 1. POST /upload-image (File) ───────>│                             │                       │
      │                                         │── 2. Run Inference ────────>│                       │
      │                                         │<─ 3. Class: Conjunctivitis ─│                       │
      │                                         │                                                     │
      │                                         │── 4. Generate JSON Summary ────────────────────────>│
      │                                         │<─ 5. Findings & Next Steps JSON ────────────────────│
      │<─ 6. Return Structured JSON Result ─────│                                                     │
      │                                         │                                                     │
      │── 7. Redirect to /app/chat?source=up ──>│                                                     │
      │                                         │                                                     │
      │── 8. Send context auto-message ────────>│                                                     │
      │      (with upload_context)              │── 9. Map and route to Conjunctivitis protocol ─────>│
      │                                         │<─ 10. Return Q1 ( Discharge ) ──────────────────────│
      │<─ 11. Display Q1 Question to User ──────│                                                     │
```

1.  **Image Upload**: The user drops a fundus or macro eye image onto the file drop area of the `/app/upload` page.
2.  **API Call**: The client initiates an HTTP POST request to `/upload-image` containing the multipart image file.
3.  **Vision Prediction**: The FastAPI endpoint reads the image bytes, applies resizing and normalization, and passes the tensor through the ViT classifier. The model outputs the class `conjunctivitis` with 94% confidence.
4.  **Clinical Synthesis**: The server queries the LLM (`llama-3.3-70b-versatile`) with a prompt containing the detected class and user-supplied notes, instructing it to return a formatted JSON payload containing the diagnosis name, triage rating (`urgent`), clinical findings, and recommended next steps.
5.  **Zustand Sync**: The frontend page parses this JSON response, saves the results to the global Zustand `useSessionStore` (`uploadResult` object), and shows a preview screen detailing the indicated condition and confidence metrics.
6.  **Transition to Chat**: The user clicks the *"Discuss with AI"* button, redirecting them to `/app/chat?source=upload`.
7.  **Auto-Context Injection**: Upon landing on the chat page, a React `useEffect` hook detects `uploadResult` in the session store. It triggers an automatic initial query: *"Please explain my conjunctivitis diagnosis and begin the assessment."*, passing the `uploadResult` details in the `upload_context` field of the request payload.
8.  **Graph Short-Circuit**: The FastAPI `/chat` endpoint receives the request. The LangGraph `triage` supervisor intercepts `upload_context`, registers the detected condition, maps it to the `conjunctivitis_protocol`, updates the state's `active_protocol` and `protocol_step` to `"start"`, and passes control to the `upload_context_explanation` node.
9.  **Explanation & Setup**: The explanation node uses Llama 3.3 to explain the conjunctivitis findings to the user and ends with: *"I need to ask you a few follow-up questions to assess your condition."* The graph outputs this response and points the state to the questionnaire.
10. **Follow-Up Interactive Loop**: The user answers subsequent questions, which route through `/chat` to `assessment_protocol` based on the active state.

---

### Journey B: Interactive Symptom Questionnaire
```
   [User Chat Input]              [triage_node]          [assessment_protocol]        [Llama 3.3 LLM]
           │                            │                          │                         │
           │── 1. "Yes" ───────────────>│                          │                         │
           │                            │── 2. Active Protocol? ──>│                         │
           │                            │      Routes to node      │                         │
           │                            │                          │── 3. Step < 10? ───────>│
           │                            │                          │      Return Next Q      │
           │<─ 4. Display Question 5 ───│<─────────────────────────│                         │
           │                            │                          │                         │
           │                            │                          │                         │
           │── 5. User answers Q10 ────>│                          │                         │
           │                            │── 6. Active Protocol? ──>│                         │
           │                            │      Routes to node      │                         │
           │                            │                          │── 7. Step == 10 ───────>│
           │                            │                          │      Compile History    │
           │                            │                          │── 8. Send to LLM ──────>│
           │                            │                          │<─ 9. Report Markdown ───│
           │<─ 10. Display Report ──────│<─────────────────────────│                         │
```

1.  **Interactive Loop**: During an active assessment session (e.g., `sch_protocol`), every user answer is submitted to the `/chat` endpoint.
2.  **Triage Interception**: The `triage` supervisor node checks the state. Since `active_protocol` is set to `sch_protocol`, it bypasses semantic routing and forwards the state directly to the `assessment_protocol` node.
3.  **Progress Tracking**: The protocol node reads the state's `protocol_step` integer value (e.g., `4`). Since it is less than the protocol's total questions (10), it retrieves the question at index `4` (e.g., *"Do you have a history of high blood pressure?"*), updates the step to `5`, and returns the question text to the user.
4.  **Final Answer**: When the user submits their answer to the 10th question, the step count reaches `10`.
5.  **Report Generation**:
    *   The protocol node parses the previous messages in the chat history representing the Q&A loop.
    *   It packages this structured conversation log and sends a request to Llama 3.3 to synthesize a final report.
    *   Llama 3.3 reviews the logs and generates a structured markdown report under two headings: `## 📋 Diagnosis Report: Subconjunctival Hemorrhage` containing a synthesized **Analysis** and **Recommendation**.
6.  **State Reset**: The node clears `active_protocol` and `protocol_step` in the state and returns the markdown report. The user is now free to ask general questions or start a new assessment.

---

### Journey C: Real-Time WebRTC Video Diagnostics
1.  **Symptom Assessment**: The user describes neurological symptoms in the chat interface: *"I feel dizzy and have double vision since falling yesterday."*
2.  **Supervisor Routing**: The `triage` node evaluates the user's message. Recognizing neurological flags (*"dizzy"*, *"double vision"*), it sets `intent` to `"functional_vision_analysis"` and `functional_test_type` to `"nystagmus_test"`.
3.  **Active Session Trigger**: Control is passed to the `functional_vision_analysis` node. Since `functional_test_results` are empty, it returns a response with `video_stream_active: True` and prompts: *"Initiating Neurological Video Scan... Please follow the moving dot."*
4.  **Client-Side Transition**: The frontend chat client processes the response. Detecting `video_stream_active === true`, it triggers a redirect to the `/app/live` video page.
5.  **Camera Initialization**: The live scan page requests user permission to access the front camera via `navigator.mediaDevices.getUserMedia` and binds the active media stream to an HTML `<video>` element.
6.  **Scan Execution**: The user clicks *"Begin Scan"*, starting a 10-second capture countdown while a teal crosshair overlays the video feed to assist with eye alignment.
7.  **Telemetry Generation**: In a production environment, WebRTC frames are processed via a background worker (`vision_worker.py`) using OpenCV thresholding to calculate pupil constriction latency or tracking anomalies. In development, the system mocks these measurements upon scan completion:
    ```json
    {
      "pupil_latency_ms": 240,
      "nystagmus_detected": false,
      "tracking_confidence": 0.96
    }
    ```
8.  **Data Persistence**: The completed scan parameters are posted to the backend database `/store-result/{call_id}` endpoint.
9.  **Results Review**: The user is redirected back to the chat workspace or `/app/results/{call_id}` page, where the system retrieves the metrics, passes them to Llama 3.3 for analysis, and updates the triage rating and recommendations.
