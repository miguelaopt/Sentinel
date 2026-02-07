from .security import Issue

# ==========================================
# 📜 COMPLIANCE KNOWLEDGE BASE
# ==========================================

COMPLIANCE_MAP = {
    # Chaves de Cloud e API
    "AWS_KEY": {
        "standard": "ISO 27001",
        "control": "A.10.1.1 - Policy on use of cryptographic controls",
        "risk": "Critical: Unrestricted access to cloud infrastructure."
    },
    "STRIPE_KEY": {
        "standard": "PCI DSS",
        "control": "Requirement 3 - Protect stored cardholder data",
        "risk": "Critical: Exposure of banking/payment credentials."
    },
    "PRIVATE_KEY": {
        "standard": "NIST SP 800-53",
        "control": "IA-5 - Authenticator Management",
        "risk": "Critical: Server impersonation or unauthorized root access."
    },
    
    # Credenciais de Base de Dados
    "DB_PASSWORD": {
        "standard": "SOC 2",
        "control": "CC6.1 - Logical Access",
        "risk": "High: Potential data breach of persistent storage."
    },
    
    # Configurações Docker/Infraestrutura
    "DOCKER_ROOT": {
        "standard": "CIS Docker Benchmark",
        "control": "4.1 - Ensure a user for the container has been created",
        "risk": "Medium: Container breakout risk (Root Privilege)."
    },
    "DOCKER_LATEST": {
        "standard": "DevSecOps Best Practices",
        "control": "Immutability",
        "risk": "Low: Unpredictable builds due to mutable tags."
    }
}

# ==========================================
# ⚖️ COMPLIANCE ENGINE
# ==========================================

def check_compliance(issues: list) -> list:
    """
    Analisa os problemas técnicos encontrados e gera alertas de Compliance.
    Ex: Se encontrar 'AWS_KEY', gera um alerta de 'ISO 27001 Violation'.
    """
    compliance_reports = []
    
    # 1. Identificar IDs únicos de problemas encontrados
    found_issue_ids = set(issue.id for issue in issues)

    for issue_id in found_issue_ids:
        if issue_id in COMPLIANCE_MAP:
            rule = COMPLIANCE_MAP[issue_id]
            
            # 2. Criar um "Issue" de Negócio/Compliance
            # Este alerta não aponta para uma linha de código, mas sim para o projeto
            compliance_issue = Issue(
                id=f"COMPLIANCE_{issue_id}",
                name=f"Non-Compliance: {rule['standard']}",
                severity="ALTO", # Violações de norma são geralmente sérias
                snippet=f"Violation of {rule['control']}. \nBusiness Risk: {rule['risk']}",
                line=0,
                file="REPORT_COMPLIANCE_SUMMARY" # Ficheiro virtual para o relatório
            )
            compliance_reports.append(compliance_issue)
            
    return compliance_reports