from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
import zipfile
import tempfile
from core.scanner import Scanner

app = FastAPI(
    title="SentinelScan API",
    description="Enterprise Security Scanner as a Service",
    version="2.0"
)

scanner = Scanner()

@app.get("/")
def read_root():
    return {"status": "SentinelScan API is running 🟢"}

@app.post("/scan")
async def scan_project(file: UploadFile = File(...)):
    print(f"📥 Recebido ficheiro: {file.filename}") # LOG NOVO
    
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Apenas ficheiros .zip são permitidos.")

    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, file.filename)
        
        # Upload
        print("⏳ A guardar ficheiro temporário...") # LOG NOVO
        try:
            with open(zip_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao guardar: {e}")

        # Extração
        print("📦 A extrair ZIP...") # LOG NOVO
        extract_path = os.path.join(temp_dir, "source_code")
        os.makedirs(extract_path, exist_ok=True)
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="ZIP corrompido.")

        # Scan
        print(f"🔎 A analisar código em: {extract_path}") # LOG NOVO
        issues = scanner.scan_directory(extract_path)
        print(f"✅ Análise concluída. Encontrados {len(issues)} problemas.") # LOG NOVO
        
        # ... (o resto do código do return mantém-se igual) ...
        summary = {
            "critical": len([i for i in issues if i['severity'] == 'CRITICO']),
            "high": len([i for i in issues if i['severity'] == 'ALTO']),
            "medium": len([i for i in issues if i['severity'] == 'MEDIO']),
            "low": len([i for i in issues if i['severity'] == 'BAIXO']),
        }

        clean_issues = []
        for issue in issues:
            clean_issue = issue.copy()
            clean_issue['file'] = issue['file'].replace(extract_path, "").lstrip(os.sep)
            clean_issues.append(clean_issue)

        return {
            "filename": file.filename,
            "scan_timestamp":  "Now", # Simplifiquei a data para não depender do os.popen no Windows
            "total_issues": len(issues),
            "summary": summary,
            "issues": clean_issues
        }