import requests
import hashlib
import json
from .security import decrypt_data
import base64


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
                config = integration['config'] 
                # Nota: O config vem como dict do Supabase (JSONB)
                # Se url_encrypted não existir, tentamos url (legado)
                url_enc = config.get('url_encrypted')
                url = decrypt_data(url_enc) if url_enc else config.get('url')
                
                if url:
                    payload = {
                        "event": "scan_completed",
                        "status": "failed" if report['summary']['critical'] > 0 else "passed",
                        "summary": report['summary'],
                        "total_issues": report['total_issues']
                    }
                    requests.post(url, json=payload, timeout=5)
                    print(f"Webhook sent to {url}")
            except Exception as e:
                print(f"Webhook failed: {e}")

def create_jira_ticket(org_integrations, report):
    """Cria ticket no Jira se houver vulnerabilidades críticas"""
    
    # Só cria ticket se houver erros CRÍTICOS e o scan falhou
    if report['summary']['critical'] == 0:
        return

    for integration in org_integrations:
        if integration['type'] == 'jira' and integration['enabled']:
            try:
                config = integration['config']
                
                # Decriptar credenciais
                domain = config.get('domain') # ex: sua-empresa.atlassian.net
                email = config.get('email')
                token = decrypt_data(config.get('token_encrypted'))
                project_key = config.get('project_key') # ex: SEC
                
                if not (domain and email and token and project_key): continue

                url = f"https://{domain}/rest/api/3/issue"
                auth_str = f"{email}:{token}"
                auth_base64 = base64.b64encode(auth_str.encode()).decode()

                headers = {
                    "Authorization": f"Basic {auth_base64}",
                    "Content-Type": "application/json"
                }

                # Criar descrição do ticket
                description = {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": f"Sentinel encontrou {report['total_issues']} vulnerabilidades."}
                            ]
                        }
                    ]
                }

                payload = {
                    "fields": {
                        "project": {"key": project_key},
                        "summary": f"[Sentinel] Security Alert: {report['summary']['critical']} Critical Issues Found",
                        "description": description,
                        "issuetype": {"name": "Bug"},
                        "priority": {"name": "High"}
                    }
                }

                # Verificar se já existe ticket aberto recentemente para evitar duplicados (Opcional/Avançado)
                # Por agora, enviamos sempre:
                resp = requests.post(url, json=payload, headers=headers)
                
                if resp.status_code == 201:
                    print(f"✅ Jira ticket created: {resp.json().get('key')}")
                else:
                    print(f"❌ Jira error: {resp.text}")

            except Exception as e:
                print(f"Jira integration failed: {e}")