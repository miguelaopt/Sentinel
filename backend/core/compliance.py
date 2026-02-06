# Mapeamento de vulnerabilidades para normas internacionais
COMPLIANCE_MAP = {
    "AWS_KEY": {
        "standard": "ISO 27001",
        "control": "A.10.1.1 - Policy on use of cryptographic controls",
        "risk": "Critical: Unrestricted access to cloud infrastructure."
    },
    "DB_PASSWORD": {
        "standard": "SOC 2",
        "control": "CC6.1 - Logical Access",
        "risk": "High: Potential data breach of persistent storage."
    },
    "DOCKER_ROOT": {
        "standard": "CIS Docker Benchmark",
        "control": "4.1 - Ensure a user for the container has been created",
        "risk": "Medium: Container breakout risk (Root Privilege)."
    },
    "UNENCRYPTED_S3": {
        "standard": "GDPR",
        "control": "Art. 32 - Security of processing",
        "risk": "High: Personal data leaks in public buckets."
    },
    "VULNERABLE_DEP": {
        "standard": "OWASP Top 10",
        "control": "A06:2021 - Vulnerable and Outdated Components",
        "risk": "High: Execution of malicious code via dependencies."
    }
}

def get_compliance(issue_id):
    return COMPLIANCE_MAP.get(issue_id, {
        "standard": "General Best Practice",
        "control": "N/A",
        "risk": "Unknown risk level."
    })