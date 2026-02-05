import os
import resend

def send_alert(issues):
    """
    Envia um email se houver vulnerabilidades CRÍTICAS.
    """
    # Filtra apenas as criticas
    critical_issues = [i for i in issues if i['severity'] == 'CRITICO']
    
    if not critical_issues:
        return False

    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        print("⚠️  RESEND_API_KEY não configurada. Email não enviado.")
        return False

    resend.api_key = api_key

    # Cria o corpo do email em HTML
    html_content = f"""
    <h1>🚨 ALERTA DE SEGURANÇA SENTINEL</h1>
    <p>O sistema detetou <strong>{len(critical_issues)}</strong> falhas críticas no último scan.</p>
    <ul>
    """
    
    for issue in critical_issues:
        html_content += f"<li><strong>{issue['name']}</strong> em <code>{issue['file']}</code> (Linha {issue['line']})</li>"
    
    html_content += "</ul><p>Por favor verifique o Dashboard imediatamente.</p>"

    try:
        # ATENÇÃO: No plano grátis do Resend, só podes enviar para o TEU PRÓPRIO email
        email_destino = os.environ.get("ALERT_EMAIL", "o_teu_email@gmail.com")
        
        r = resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": email_destino,
            "subject": f"🚨 SENTINEL: {len(critical_issues)} Falhas Críticas Detetadas!",
            "html": html_content
        })
        print(f"📧 Email de alerta enviado para {email_destino}!")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")
        return False