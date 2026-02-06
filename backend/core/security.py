import os
from cryptography.fernet import Fernet
import base64

# Gera ou carrega a chave mestra do .env
# No .env deves ter: ENCRYPTION_KEY=... (Gera uma com Fernet.generate_key())
KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(KEY.encode())

def encrypt_data(data: str) -> str:
    """Encripta uma string sensível (ex: Webhook URL, Jira Token)"""
    if not data: return ""
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    """Decripta para usar no momento do envio"""
    if not token: return ""
    try:
        return cipher.decrypt(token.encode()).decode()
    except:
        return None