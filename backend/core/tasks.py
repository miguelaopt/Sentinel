import os
import json
import zipfile
import shutil
from supabase import create_client
from .celery_app import celery_app
from .scanner import Scanner
from .integrations import filter_ignored_issues, trigger_webhooks, create_jira_ticket # <--- Importar

# --- CONFIGURAÇÃO SUPABASE (SERVICE ROLE) ---
# É crucial que a chave SERVICE_ROLE esteja no .env e no docker-compose
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # <--- Tem de ser a chave SERVICE ROLE

if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Supabase credentials missing in Worker.")

# Cliente com privilégios de Admin (Bypass RLS)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

scanner_engine = Scanner()

@celery_app.task(name="scan_code_task")
def scan_code_task(file_path, policies, org_id):
    """
    Executa o scan e GRAVA na base de dados.
    """
    extract_path = file_path + "_extracted"
    
    try:
        # 1. Extrair
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        # 2. Scan
        raw_issues = scanner_engine.scan_directory(extract_path, policies)

        # 3. Filtrar Ignorados
        ignored_hashes = set()
        if org_id:
            try:
                res = supabase.table("ignored_issues").select("issue_hash").eq("org_id", org_id).execute()
                ignored_hashes = {item['issue_hash'] for item in res.data}
            except Exception as e:
                print(f"Warning: Could not fetch ignored issues: {e}")
        
        active_issues = filter_ignored_issues(raw_issues, ignored_hashes)

        # 4. Sumário
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for issue in active_issues:
            sev = issue.get("severity", "LOW").lower()
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

        # 5. GRAVAR NA BASE DE DADOS (CRUCIAL)
        # Usamos o cliente 'supabase' que foi iniciado com a Service Key
        try:
            scan_entry = {
                "org_id": org_id,
                "report": report,
                "status": "Completed"
            }
            # .execute() é necessário para efetivar a inserção
            data = supabase.table("scans").insert(scan_entry).execute()
            print(f"✅ Scan saved via Worker. ID: {data.data[0]['id']}")
        except Exception as db_err:
            print(f"❌ Error saving to Supabase: {db_err}")
            # Em caso de erro, não falhamos a task, mas o frontend não vai ver histórico novo
            
        # 6. Webhooks
        if org_id:
            try:
                res = supabase.table("integrations").select("*").eq("org_id", org_id).execute()
                integrations_list = res.data
                
                # Disparar Webhooks
                trigger_webhooks(integrations_list, report)
                
                # Criar Ticket no Jira (Novo)
                create_jira_ticket(integrations_list, report)
                
            except Exception as e:
                print(f"Integrations error: {e}")

        return report

    except Exception as e:
        print(f"Task Failed: {e}")
        return {"status": "failed", "error": str(e)}
        
    finally:
        if os.path.exists(extract_path): shutil.rmtree(extract_path)
        if os.path.exists(file_path): os.remove(file_path)