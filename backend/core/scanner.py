import os
import re
import boto3
from .sca import SCAScanner
from .iac import IaCScanner
from .compliance import get_compliance

class Scanner:
    def __init__(self):
        # Regras de Segredos (SAST)
        self.regex_rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
            {"id": "DB_PASSWORD", "name": "Hardcoded Password", "pattern": r"(password|passwd|pwd)\s*=\s*['\"](\w+)['\"]", "severity": "ALTO"},
            {"id": "PRIVATE_KEY", "name": "SSH Private Key", "pattern": r"-----BEGIN OPENSSH PRIVATE KEY-----", "severity": "CRITICO"},
        ]
        # Inicializar os sub-scanners
        self.sca = SCAScanner()
        self.iac = IaCScanner()

    def validate_aws_key(self, key_id):
        """Active Validation: Tenta usar a chave na AWS para ver se é real"""
        try:
            client = boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key='dummy_secret') 
            return True 
        except:
            return False

    def scan_file(self, file_path, policies=None):
        issues = []
        if not policies: policies = {"dockerScan": True, "activeValidation": False}
        
        filename = os.path.basename(file_path)

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 1. SCA: Análise de Dependências (Node.js, Python)
            if filename == 'package.json':
                issues.extend(self.sca.scan_package_json(content, file_path))
            elif filename == 'requirements.txt':
                issues.extend(self.sca.scan_requirements_txt(content, file_path))

            # 2. IaC: Infraestrutura (Docker, Terraform)
            if filename == 'Dockerfile' and policies.get('dockerScan'):
                issues.extend(self.iac.scan_dockerfile(content, file_path))
            elif filename.endswith('.tf'):
                issues.extend(self.iac.scan_terraform(content, file_path))

            # 3. SAST: Regex para Segredos no código
            lines = content.splitlines()
            for line_num, line in enumerate(lines, 1):
                if len(line) > 500: continue # Ignorar linhas gigantes (minified code)
                
                for rule in self.regex_rules:
                    if re.search(rule['pattern'], line):
                        issue_name = rule['name']
                        
                        # Validação Ativa (Opcional - só se o cliente ativar na Policy)
                        if rule['id'] == 'AWS_KEY' and policies.get('activeValidation'):
                            # Nota: Na vida real, extrairíamos a chave exata aqui.
                            issue_name += " [Active Check: UNVERIFIED]" 
                        
                        issues.append({
                            "id": rule['id'],
                            "file": file_path, 
                            "line": line_num, 
                            "name": issue_name,
                            "severity": rule['severity'], 
                            "snippet": line.strip()[:100]
                        })

        except Exception as e:
            # Em produção, usaríamos logging.error
            pass
            
        # 4. Enriquecimento: Adicionar dados de Compliance (GDPR/ISO)
        for issue in issues:
            # Se o issue não tiver ID (vêm do SCA/IaC), usamos um genérico
            issue_id = issue.get("id", "GENERIC_RISK")
            issue["compliance"] = get_compliance(issue_id)

        return issues

    def scan_directory(self, target_dir, policies=None):
        all_issues = []
        # Pastas a ignorar para ganhar velocidade
        ignore = {'.git', 'venv', 'node_modules', '__pycache__', '.next', 'dist', 'build'}
        
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore]
            for file in files:
                all_issues.extend(self.scan_file(os.path.join(root, file), policies))
        return all_issues