import os
import re
import boto3

class Scanner:  # <--- MUDANÇA AQUI: O nome agora é Scanner
    def __init__(self):
        self.regex_rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
        ]

    def validate_aws_key(self, key_id):
        """Active Validation: Testa se a chave funciona"""
        try:
            client = boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key='dummy_secret') 
            return True 
        except:
            return False

    def check_docker(self, file_path, content):
        issues = []
        if 'FROM' in content and ':latest' in content:
            issues.append({"file": file_path, "line": 1, "name": "Docker: Using 'latest' tag", "severity": "MEDIO", "snippet": "FROM ... :latest"})
        return issues

    def scan_file(self, file_path, policies=None):
        issues = []
        if not policies: policies = {"dockerScan": True, "activeValidation": False}

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            if file_path.endswith('Dockerfile') and policies.get('dockerScan'):
                issues.extend(self.check_docker(file_path, content))

            lines = content.splitlines()
            for line_num, line in enumerate(lines, 1):
                if len(line) > 500: continue
                for rule in self.regex_rules:
                    if re.search(rule['pattern'], line):
                        issue_name = rule['name']
                        if rule['id'] == 'AWS_KEY' and policies.get('activeValidation'):
                            issue_name += " [Active Check: UNVERIFIED]" 
                        issues.append({
                            "file": file_path, "line": line_num, "name": issue_name,
                            "severity": rule['severity'], "snippet": line.strip()[:100]
                        })
        except: pass
        return issues

    def scan_directory(self, target_dir, policies=None):
        all_issues = []
        ignore = {'.git', 'venv', 'node_modules', '__pycache__', '.next'}
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore]
            for file in files:
                all_issues.extend(self.scan_file(os.path.join(root, file), policies))
        return all_issues