import os
import re
import yaml

class Scanner:
    def __init__(self, rules_file='rules.yaml'):
        # Regras Hardcoded para garantir funcionamento mesmo sem ficheiro
        self.rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
            {"id": "PRIVATE_KEY", "name": "Private Key Block", "pattern": r"-----BEGIN PRIVATE KEY-----", "severity": "CRITICO"},
            {"id": "EMAIL", "name": "Email Address (PII)", "pattern": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "severity": "MEDIO"},
            {"id": "IPV4", "name": "IP Address Exposed", "pattern": r"\b(?!127\.0\.0\.1)(?!0\.0\.0\.0)(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", "severity": "BAIXO"},
            {"id": "GENERIC_PWD", "name": "Potential Password", "pattern": r"(password|passwd|pwd)\s*=\s*['\"][^'\"]{3,}['\"]", "severity": "ALTO"}
        ]

    def scan_directory(self, target_dir):
        issues = []
        # Caminhos a ignorar para não ficar lento
        ignore_dirs = {'.git', 'venv', '__pycache__', 'node_modules', '.next'}
        
        for root, dirs, files in os.walk(target_dir):
            # Filtrar pastas ignoradas
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                # Ignorar ficheiros de imagem ou binários
                if file.endswith(('.png', '.jpg', '.pyc', '.exe', '.db', '.sqlite')):
                    continue
                    
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        for line_num, line in enumerate(lines, 1):
                            for rule in self.rules:
                                if re.search(rule['pattern'], line):
                                    issues.append({
                                        "file": file_path,
                                        "line": line_num,
                                        "name": rule['name'],
                                        "severity": rule['severity'],
                                        "snippet": line.strip()[:50] # Guarda um pedaço do código para mostrar
                                    })
                except Exception as e:
                    pass # Ignora erros de leitura de ficheiros
                    
        return issues