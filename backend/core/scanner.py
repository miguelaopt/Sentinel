import os
import re
import ast
import json
import concurrent.futures
import boto3
from botocore.exceptions import ClientError

class SASTScanner:
    def __init__(self):
        self.regex_rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
        ]
    # --- 1. CONTAINER SCANNING (DOCKER) ---
    def check_docker(self, file_path, content):
        issues = []
        if file_path.endswith('Dockerfile'):
            # Regra: Não usar tag 'latest' em produção
            if 'FROM' in content and ':latest' in content:
                issues.append({
                    "file": file_path, "line": 1, "name": "Docker: Using 'latest' tag",
                    "severity": "MEDIO", "snippet": "FROM ... :latest (Unstable)"
                })
            # Regra: Não correr como root
            if 'USER' not in content:
                issues.append({
                    "file": file_path, "line": 1, "name": "Docker: Running as Root",
                    "severity": "ALTO", "snippet": "Missing USER instruction"
                })
        return issues
    
    # --- 2. ACTIVE VALIDATION (VALIDAR SE A CHAVE É REAL) ---
    def validate_aws_key(self, key_id, secret):
        """Tenta ligar à AWS para ver se a chave funciona"""
        try:
            client = boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=secret)
            client.get_caller_identity()
            return True # É UMA CHAVE REAL E PERIGOSA!
        except:
            return False # É falsa ou inativa

    def check_sca(self, file_path, content):
        """Verifica versões vulneráveis em package.json e requirements.txt"""
        issues = []
        file_name = os.path.basename(file_path)

        # 1. Python (requirements.txt)
        if file_name == 'requirements.txt':
            if 'django==' in content.lower():
                # Simulação: Django abaixo da versão 4.0 é considerado vulnerável
                match = re.search(r'django==([0-3]\.[0-9]+)', content.lower())
                if match:
                    issues.append({
                        "file": file_path, "line": 1, "name": "CVE-2021-44420 (Django Vulnerable)",
                        "severity": "ALTO", "snippet": match.group(0)
                    })

        # 2. Node.js (package.json)
        if file_name == 'package.json':
            try:
                data = json.loads(content)
                deps = data.get('dependencies', {})
                if 'react' in deps:
                    version = deps['react'].replace('^', '').replace('~', '')
                    if version.startswith('16') or version.startswith('15'):
                         issues.append({
                            "file": file_path, "line": 1, "name": "CVE-2022-2432 (React Old Version)",
                            "severity": "MEDIO", "snippet": f'"react": "{version}"'
                        })
            except:
                pass
        return issues

    def check_sql_injection(self, file_path, content):
        issues = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and ('query' in target.id.lower()):
                            if isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.Add):
                                issues.append({
                                    "file": file_path, "line": node.lineno,
                                    "name": "SQL Injection (Concatenation)", "severity": "CRITICO",
                                    "snippet": "Detected unsafe query construction"
                                })
        except: pass
        return issues

    def scan_file(self, file_path):
        issues = []
        file_name = os.path.basename(file_path)

        if file_name in ['security_report.json', 'report.json', 'package-lock.json', 'yarn.lock', 'notifications.py', 'page.js']: return []
        if file_path.endswith(('.png', '.jpg', '.exe', '.pyc')): return []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # SCA Check
            if file_name in ['package.json', 'requirements.txt']:
                issues.extend(self.check_sca(file_path, content))

            # SQL Check
            if file_path.endswith('.py'):
                issues.extend(self.check_sql_injection(file_path, content))
            
            if file_path.endswith('Dockerfile'):
             issues.extend(self.check_docker(file_path, content))
            
            for rule in self.regex_rules:
                match = re.search(rule['pattern'], content)
                if match:
                    severity = rule['severity']
                    extra_info = ""
                
                    # Se for AWS, vamos testar!
                if rule['id'] == 'AWS_KEY':
                    # Isto é simplificado, precisarias extrair o segredo também do código
                    # Para o exemplo, vamos assumir que o risco aumenta
                    extra_info = " (Potential Active Key)" 
                
                issues.append({
                    "file": file_path, "line": 1, 
                    "name": rule['name'] + extra_info,
                    "severity": severity, 
                    "snippet": match.group(0)
                })

            # Regex Check
            lines = content.splitlines()
            for line_num, line in enumerate(lines, 1):
                if len(line) > 500: continue
                for rule in self.regex_rules:
                    if re.search(rule['pattern'], line):
                        if 'scanner.py' in file_path: continue
                        issues.append({
                            "file": file_path, "line": line_num, "name": rule['name'],
                            "severity": rule['severity'], "snippet": line.strip()[:100]
                        })
        except: pass
        return issues

    def scan_directory(self, target_dir):
        all_files = []
        ignore_dirs = {'.git', 'venv', 'env', '__pycache__', 'node_modules', '.next', '.vscode'}
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                all_files.append(os.path.join(root, file))
        
        results = []
        with concurrent.futures.ProcessPoolExecutor() as executor:
            futures = executor.map(self.scan_file, all_files)
            for file_issues in futures:
                results.extend(file_issues)
        return results

Scanner = SASTScanner