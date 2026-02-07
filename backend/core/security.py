import os
import re
import math
from cryptography.fernet import Fernet

# ==========================================
# 🔐 SECRETS & ENCRYPTION (Lógica Existente)
# ==========================================

# Gera ou carrega a chave mestra do .env
KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(KEY.encode())

def encrypt_data(data: str) -> str:
    """Encripta uma string sensível (ex: Webhook URL, Jira Token)"""
    if not data: return ""
    try:
        return cipher.encrypt(data.encode()).decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        return ""

def decrypt_data(token: str) -> str:
    """Decripta para usar no momento do envio"""
    if not token: return ""
    try:
        return cipher.decrypt(token.encode()).decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return None

# ==========================================
# 🕵️‍♂️ SECURITY ANALYSIS (Nova Lógica)
# ==========================================

class Issue:
    """Define um problema de segurança encontrado"""
    def __init__(self, id, name, severity, snippet, line, file=None):
        self.id = id
        self.name = name
        self.severity = severity
        self.snippet = snippet
        self.line = line
        self.file = file
    
    def dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "severity": self.severity,
            "snippet": self.snippet,
            "line": self.line,
            "file": self.file
        }

def calculate_entropy(text: str) -> float:
    """Calcula entropia de Shannon para detetar chaves aleatórias"""
    if not text: return 0
    entropy = 0
    for x in range(256):
        p_x = float(text.count(chr(x))) / len(text)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

def analyze_security(content: str, rules: list) -> list:
    """Analisa o conteúdo linha a linha usando as regras do YAML"""
    issues = []
    lines = content.splitlines()
    
    for line_num, line in enumerate(lines, 1):
        if len(line) > 500: continue  # Ignorar linhas muito longas (ex: minified JS)
        
        for rule in rules:
            pattern = rule.get('pattern')
            # Verifica se a linha corresponde ao padrão Regex da regra
            if pattern and re.search(pattern, line):
                issues.append(Issue(
                    id=rule.get('id', 'UNKNOWN'),
                    name=rule.get('name', 'Vulnerability Found'),
                    severity=rule.get('severity', 'MEDIO'),
                    snippet=line.strip()[:100],
                    line=line_num
                ))
    return issues

def analyze_secrets(content: str) -> list:
    """Procura segredos Hardcoded (Entropia + Padrões Críticos de Fallback)"""
    issues = []
    lines = content.splitlines()
    
    # Padrões críticos de fallback (caso o rules.yaml falhe ou não tenha estes)
    critical_patterns = [
        (r"-----BEGIN OPENSSH PRIVATE KEY-----", "SSH_KEY", "CRITICO"),
        (r"sk_live_[0-9a-zA-Z]{24}", "STRIPE_KEY", "CRITICO"),
    ]

    for line_num, line in enumerate(lines, 1):
        if len(line) > 500: continue
        
        # 1. Verificar Padrões Críticos
        for pattern, rule_id, severity in critical_patterns:
            if re.search(pattern, line):
                issues.append(Issue(
                    id=rule_id,
                    name=f"Exposed Secret: {rule_id}",
                    severity=severity,
                    snippet="[REDACTED SECRET]", # Nunca mostrar a chave real no log
                    line=line_num
                ))
        
        # 2. Verificar Entropia (Strings aleatórias suspeitas)
        # Procura strings longas (>20 chars) entre aspas
        potential_secrets = re.findall(r"['\"]([A-Za-z0-9+/=]{20,})['\"]", line)
        for secret in potential_secrets:
            # Se a entropia for alta (> 4.5), provavelemnte é uma API Key ou Password
            if calculate_entropy(secret) > 4.5:
                issues.append(Issue(
                    id="HIGH_ENTROPY",
                    name="Suspicious High Entropy String",
                    severity="ALTO",
                    snippet="[POTENTIAL SECRET REDACTED]",
                    line=line_num
                ))

    return issues