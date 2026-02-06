import os
import shutil
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from core.celery_app import celery_app
from core.tasks import scan_code_task
from celery.result import AsyncResult
from pydantic import BaseModel
import google.generativeai as genai
from core.integrations import generate_issue_hash
from core.security import encrypt_data

# --- CONFIGURAÇÃO ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class JiraRequest(BaseModel):
    domain: str
    email: str
    token: str
    project_key: str

app = FastAPI(title="Sentinel Enterprise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- DEPENDÊNCIA DE SEGURANÇA ---
async def get_current_org_id(
    authorization: Optional[str] = Header(None), 
    x_api_key: Optional[str] = Header(None)
):
    """
    Descobre o org_id baseado no Token (Frontend) ou API Key (CLI)
    """
    user_id = None

    # 1. Tentar via API Key (CLI / CI/CD)
    if x_api_key:
        # Procurar chave na DB
        res = supabase.table("api_keys").select("user_id").eq("key_value", x_api_key).execute()
        if res.data:
            user_id = res.data[0]['user_id']
    
    # 2. Tentar via JWT Token (Frontend)
    elif authorization:
        try:
            token = authorization.replace("Bearer ", "")
            user = supabase.auth.get_user(token)
            if user:
                user_id = user.user.id
        except Exception as e:
            print(f"Auth Error: {e}")

    if not user_id:
        # Se for um scan anónimo ou falhar autenticação, devolvemos None
        # (O worker depois cria uma org temporária ou rejeita)
        return None

    # 3. Buscar a Org ID do perfil
    try:
        profile = supabase.table("profiles").select("org_id").eq("id", user_id).single().execute()
        if profile.data:
            return profile.data['org_id']
    except:
        pass
    
    return None

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "Sentinel Enterprise System Operational"}

@app.post("/settings/jira")
async def save_jira(
    req: JiraRequest, 
    org_id: str = Depends(get_current_org_id)
):
    if not org_id: raise HTTPException(401, "Unauthorized")
    
    # Encriptar apenas o token
    token_enc = encrypt_data(req.token)
    
    config_data = {
        "domain": req.domain,
        "email": req.email,
        "project_key": req.project_key,
        "token_encrypted": token_enc
    }
    
    # Upsert na tabela integrations
    existing = supabase.table("integrations").select("*").eq("org_id", org_id).eq("type", "jira").execute()
    
    if existing.data:
        uid = existing.data[0]['id']
        supabase.table("integrations").update({"config": config_data, "enabled": True}).eq("id", uid).execute()
    else:
        supabase.table("integrations").insert({
            "org_id": org_id,
            "type": "jira",
            "config": config_data,
            "enabled": True
        }).execute()
        
    return {"status": "updated", "message": "Jira integration active."}

@app.post("/scan")
async def start_scan(
    file: UploadFile = File(...), 
    policies_json: str = Form("{}"),
    org_id: str = Depends(get_current_org_id) # Injeção automática da Org
):
    try:
        policies = json.loads(policies_json)
        
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Passar o org_id para a tarefa
        task = scan_code_task.delay(file_location, policies, org_id)
        
        return {
            "message": "Scan started",
            "task_id": task.id,
            "status": "pending",
            "org_detected": org_id is not None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scan/{task_id}")
def get_scan_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state == 'PENDING':
        return {"status": "processing"}
    elif task_result.state == 'SUCCESS':
        return {"status": "completed", "report": task_result.result}
    elif task_result.state == 'FAILURE':
        return {"status": "failed", "error": str(task_result.result)}
    
    return {"status": task_result.state}

# --- AI FIX ---
class FixRequest(BaseModel):
    snippet: str
    vulnerability: str

@app.post("/fix-code")
def fix_code_ai(req: FixRequest):
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key: return {"fixed_code": "AI Key not configured."}
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"Fix this code snippet securely. Vulnerability: {req.vulnerability}.\nCode:\n{req.snippet}\nReturn ONLY the fixed code block."
        
        response = model.generate_content(prompt)
        return {"fixed_code": response.text.replace("```", "")}
    except Exception as e:
        return {"fixed_code": "AI Error."}

class WebhookRequest(BaseModel):
    url: str

@app.post("/settings/webhook")
async def save_webhook(
    req: WebhookRequest, 
    org_id: str = Depends(get_current_org_id)
):
    if not org_id: raise HTTPException(401, "Unauthorized")
    
    # 1. Encriptar URL
    url_enc = encrypt_data(req.url)
    
    # 2. Guardar na tabela 'integrations' via Supabase
    # Verifica se já existe um webhook para esta org e atualiza, ou cria novo
    existing = supabase.table("integrations").select("*").eq("org_id", org_id).eq("type", "webhook").execute()
    
    config_data = {"url_encrypted": url_enc}
    
    if existing.data:
        # Update
        uid = existing.data[0]['id']
        supabase.table("integrations").update({"config": config_data, "enabled": True}).eq("id", uid).execute()
    else:
        # Insert
        supabase.table("integrations").insert({
            "org_id": org_id,
            "type": "webhook",
            "config": config_data,
            "enabled": True
        }).execute()
        
    return {"status": "updated", "message": "Webhook secure and active."}

class IgnoreRequest(BaseModel):
    file: str
    rule_id: str
    snippet: str
    reason: str

@app.post("/issues/ignore")
async def ignore_issue_endpoint(
    req: IgnoreRequest,
    user_token: str = Header(None, alias="Authorization"), # Para saber quem ignorou
    org_id: str = Depends(get_current_org_id)
):
    if not org_id: raise HTTPException(401, "Unauthorized")
    
    # Gerar Hash consistente
    issue_obj = {"file": req.file, "id": req.rule_id, "snippet": req.snippet}
    ihash = generate_issue_hash(issue_obj)
    
    # Obter ID do user através do token
    user_id = None
    if user_token:
        try:
            user = supabase.auth.get_user(user_token.replace("Bearer ", ""))
            user_id = user.user.id
        except: pass

    try:
        supabase.table("ignored_issues").insert({
            "org_id": org_id,
            "issue_hash": ihash,
            "reason": req.reason,
            "actor_id": user_id
        }).execute()
        return {"status": "ignored", "hash": ihash}
    except Exception as e:
        # Se já existir (duplicado), não faz mal
        return {"status": "exists", "hash": ihash}