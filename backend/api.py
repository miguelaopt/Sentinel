from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware # <--- IMPORTANTE
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

# --- CORREÇÃO DO FAILED TO FETCH (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ACEITA TUDO (Frontend Local e Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = Scanner()

# --- CONFIGURAÇÃO GEMINI ---
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
model = None

if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI Configurado com sucesso.")
    except Exception as e:
        print(f"⚠️ Erro ao configurar Gemini: {e}")

class FixRequest(BaseModel):
    snippet: str
    vulnerability: str

@app.get("/")
def read_root():
    return {"status": "Sentinel AI Core Online 🟢", "ai_engine": "Gemini 1.5 Flash"}

@app.post("/scan")
async def scan_project(file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Apenas ficheiros .zip são permitidos.")

    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extract_path = os.path.join(temp_dir, "source_code")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
        except:
            raise HTTPException(status_code=400, detail="Ficheiro ZIP corrompido.")

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
    if not model:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado no servidor (Falta GOOGLE_API_KEY).")

    prompt = f"""
    You are an Expert Security Engineer. Fix the code below which has a '{request.vulnerability}'.
    Return ONLY the fixed code without markdown formatting.
    
    CODE:
    {request.snippet}
    """
    
    try:
        response = model.generate_content(prompt)
        return {"fixed_code": response.text.strip()}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na IA: {str(e)}")