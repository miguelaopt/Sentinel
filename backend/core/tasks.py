import os
import json
import zipfile
import shutil
from supabase import create_client
from .celery_app import celery_app
from .scanner import Scanner
from .integrations import filter_ignored_issues, trigger_webhooks

# Setup Supabase (Para ler ignores e integrações)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

scanner_engine = Scanner()

@celery_app.task(name="scan_code_task")
def scan_code_task(file_path, policies, org_id):
    """
    Worker atualizado com:
    1. Gestão de Falsos Positivos
    2. Webhooks de Saída
    """
    extract_path = file_path + "_extracted"
    
    try:
        # 1. Extrair Zip
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        # 2. Executar Scan
        raw_issues = scanner_engine.scan_directory(extract_path, policies)

        # 3. Filtrar Falsos Positivos (NOVO)
        ignored_hashes = set()
        if org_id:
            res = supabase.table("ignored_issues").select("issue_hash").eq("org_id", org_id).execute()
            ignored_hashes = {item['issue_hash'] for item in res.data}
        
        active_issues = filter_ignored_issues(raw_issues, ignored_hashes)

        # 4. Processar Resultados
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for issue in active_issues:
            sev = issue.get("severity", "LOW").lower()
            # Mapeamento simples
            if "critico" in sev or "critical" in sev: severity_counts["critical"] += 1
            elif "alto" in sev or "high" in sev: severity_counts["high"] += 1
            elif "medio" in sev or "medium" in sev: severity_counts["medium"] += 1
            else: severity_counts["low"] += 1

        report = {
            "status": "completed",
            "summary": severity_counts,
            "total_issues": len(active_issues),
            "issues": active_issues,
            "ignored_count": len(raw_issues) - len(active_issues)
        }

        # 5. Disparar Webhooks (NOVO)
        if org_id:
            res = supabase.table("integrations").select("*").eq("org_id", org_id).execute()
            trigger_webhooks(res.data, report)

        return report

    except Exception as e:
        return {"status": "failed", "error": str(e)}
        
    finally:
        if os.path.exists(extract_path): shutil.rmtree(extract_path)
        if os.path.exists(file_path): os.remove(file_path)