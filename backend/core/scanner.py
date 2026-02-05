import os
import re
import boto3

class SASTScanner:
    def __init__(self):
        # Regras estáticas
        self.regex_rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
        ]

    # --- VALIDATORS ---
    def validate_aws_key(self, key_id):
        """Active Validation: Testa se a chave funciona"""
        try:
            # Tenta uma chamada leve (GetCallerIdentity)
            client = boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key='dummy_secret') 
            # Nota: Num cenário real precisarias do Secret também, mas o regex só apanha o ID.
            # Aqui simulamos que se o formato for válido, passamos para validação.
            return True 
        except:
            return False

    def check_docker(self, file_path, content):
        issues = []
        if 'FROM' in content and ':latest' in content:
            issues.append({"file": file_path, "line": 1, "name": "Docker: Using 'latest' tag", "severity": "MEDIO", "snippet": "FROM ... :latest"})
        return issues

    # --- MAIN SCAN FUNCTION COM POLICIES ---
    def scan_file(self, file_path, policies=None):
        issues = []
        file_name = os.path.basename(file_path)
        
        # Default policies se não forem passadas
        if not policies:
            policies = {"dockerScan": True, "activeValidation": False}

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 1. DOCKER SCAN (Só corre se a política permitir)
            if file_path.endswith('Dockerfile') and policies.get('dockerScan'):
                issues.extend(self.check_docker(file_path, content))

            # 2. REGEX SCAN & ACTIVE VALIDATION
            lines = content.splitlines()
            for line_num, line in enumerate(lines, 1):
                for rule in self.regex_rules:
                    if re.search(rule['pattern'], line):
                        issue_name = rule['name']
                        
                        # Active Validation (Só corre se a política permitir e for AWS)
                        if rule['id'] == 'AWS_KEY' and policies.get('activeValidation'):
                            # Aqui faríamos a validação real. 
                            # Como exemplo, adicionamos uma tag ao nome
                            issue_name += " [Active Check: UNVERIFIED]" 

                        issues.append({
                            "file": file_path, 
                            "line": line_num, 
                            "name": issue_name,
                            "severity": rule['severity'], 
                            "snippet": line.strip()[:100]
                        })
        except Exception:
            pass
            
        return issues

    def scan_directory(self, target_dir, policies=None):
        all_issues = []
        for root, _, files in os.walk(target_dir):
            for file in files:
                full_path = os.path.join(root, file)
                # Passar as policies para cada ficheiro
                all_issues.extend(self.scan_file(full_path, policies))
        return all_issues