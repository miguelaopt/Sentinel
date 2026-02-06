import os
from cryptography.fernet import Fernet
import base64

# Gera ou carrega a chave mestra do .env
# Se não houver chave no .env, gera uma temporária (mas o ideal é fixar no .env)
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