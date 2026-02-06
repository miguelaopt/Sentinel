import requests
import hashlib
import json
from .security import decrypt_data

def generate_issue_hash(issue):
    """Cria um ID único para o erro baseado no ficheiro e regra"""
    # Hash: filename + rule_id + snippet (limpo de espaços)
    unique_str = f"{issue['file']}-{issue.get('id', 'unknown')}-{issue.get('snippet', '').strip()}"
    return hashlib.sha256(unique_str.encode()).hexdigest()

def filter_ignored_issues(issues, ignored_hashes):
    """Remove issues que já foram marcados como ignorados"""
    active_issues = []
    for issue in issues:
        ihash = generate_issue_hash(issue)
        issue['hash'] = ihash # Adiciona o hash ao objeto para o frontend usar
        if ihash not in ignored_hashes:
            active_issues.append(issue)
    return active_issues

def trigger_webhooks(org_integrations, report):
    """Envia o relatório para os Webhooks configurados pela empresa"""
    for integration in org_integrations:
        if integration['type'] == 'webhook' and integration['enabled']:
            try:
                # Decriptar URL
                config = integration['config'] # Assumindo que vem do Supabase
                url = decrypt_data(config.get('url_encrypted'))
                
                if url:
                    payload = {
                        "event": "scan_completed",
                        "status": "failed" if report['summary']['critical'] > 0 else "passed",
                        "summary": report['summary'],
                        "total_issues": report['total_issues']
                    }
                    requests.post(url, json=payload, timeout=5)
            except Exception as e:
                print(f"Webhook failed: {e}")