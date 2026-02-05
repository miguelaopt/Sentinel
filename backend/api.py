from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import zipfile
import tempfile
from core.scanner import Scanner
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sentinel Enterprise API", version="3.0")

# Configurar CORS (Para o Frontend poder falar com este Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, coloca o domínio da Vercel aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = Scanner()

# --- CONFIGURAÇÃO GEMINI ---
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    # Usamos o 'gemini-1.5-flash' porque é muito rápido para correções de código
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

class FixRequest(BaseModel):
    snippet: str
    vulnerability: str

@app.get("/")
def read_root():
    return {"status": "Sentinel AI Core Online 🟣", "engine": "Google Gemini"}

@app.post("/scan")
async def scan_project(file: UploadFile = File(...)):
    """Recebe ZIP, analisa e devolve relatório SCA + SAST"""
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Apenas .zip permitidos")

    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extract_path = os.path.join(temp_dir, "source")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
        except:
            raise HTTPException(status_code=400, detail="ZIP Corrompido")

        # O Scanner já tem a lógica de SCA e SQL Injection que fizeste antes
        issues = scanner.scan_directory(extract_path)

        summary = {
            "critical": len([i for i in issues if i['severity'] == 'CRITICO']),
            "high": len([i for i in issues if i['severity'] == 'ALTO']),
            "medium": len([i for i in issues if i['severity'] == 'MEDIO']),
            "low": len([i for i in issues if i['severity'] == 'BAIXO']),
        }

        clean_issues = []
        for issue in issues:
            c = issue.copy()
            c['file'] = issue['file'].replace(extract_path, "").lstrip(os.sep)
            clean_issues.append(c)

        return {
            "scan_timestamp": "Now",
            "total_issues": len(issues),
            "summary": summary,
            "issues": clean_issues
        }

@app.post("/fix-code")
async def fix_code_with_ai(request: FixRequest):
    """Usa Google Gemini para corrigir vulnerabilidades"""
    if not model:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY não configurada no servidor.")

    # Prompt de Engenharia para o Gemini
    prompt = f"""
    You are an Expert Cyber Security Engineer.
    Your task is to fix the following code snippet which contains a '{request.vulnerability}' vulnerability.
    
    RULES:
    1. Return ONLY the fixed code block.
    2. Do not add markdown formatting (like ```python).
    3. Do not add explanations. Just the code.
    
    VULNERABLE CODE:
    {request.snippet}
    """
    
    try:
        response = model.generate_content(prompt)
        return {"fixed_code": response.text.strip()}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="Erro ao contactar a IA.")