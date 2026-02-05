import os
import re
import ast
import concurrent.futures

class SASTScanner:
    """
    Scanner Avançado de Análise Estática (SAST).
    Usa AST para Python e Regex otimizado para outros ficheiros.
    """
    def __init__(self):
        self.regex_rules = [
            {"id": "AWS_KEY", "name": "AWS Access Key", "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "severity": "CRITICO"},
            {"id": "STRIPE_KEY", "name": "Stripe Secret Key", "pattern": r"sk_live_[0-9a-zA-Z]{24}", "severity": "CRITICO"},
            {"id": "PRIVATE_KEY", "name": "Private Key Block", "pattern": r"-----BEGIN PRIVATE KEY-----", "severity": "CRITICO"},
            {"id": "EMAIL", "name": "Email Address (PII)", "pattern": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "severity": "MEDIO"},
            {"id": "IPV4", "name": "IP Address Exposed", "pattern": r"\b(?!127\.0\.0\.1)(?!0\.0\.0\.0)(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", "severity": "BAIXO"},
        ]

    def check_sql_injection(self, file_path, content):
        """
        Analisa código Python à procura de concatenação de strings em SQL (Vulnerabilidade Crítica).
        Usa Abstract Syntax Tree (AST) em vez de Regex.
        """
        issues = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                # Procura atribuições de variáveis (ex: query = ...)
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and ('query' in target.id.lower() or 'sql' in target.id.lower()):
                            # Se a variável tem nome de SQL, verifica se há concatenação (+) ou formatação perigosa (%)
                            if isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.Add):
                                issues.append({
                                    "file": file_path,
                                    "line": node.lineno,
                                    "name": "SQL Injection (String Concatenation)",
                                    "severity": "CRITICO",
                                    "snippet": "Detected unsafe query construction using '+' operator"
                                })
                            elif isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.Mod):
                                issues.append({
                                    "file": file_path,
                                    "line": node.lineno,
                                    "name": "SQL Injection (Old Style Formatting)",
                                    "severity": "ALTO",
                                    "snippet": "Detected unsafe query construction using '%' operator"
                                })
        except:
            pass # Ignora erros de sintaxe (ficheiros que não são python válido)
        return issues

    def scan_file(self, file_path):
        """
        Analisa UM único ficheiro. Função isolada para poder correr em paralelo.
        """
        issues = []
        file_name = os.path.basename(file_path)

        # --- CORREÇÃO AQUI ---
        # Adicionei 'report.json' e 'notifications.py' à lista negra
        if file_name in ['security_report.json', 'report.json', 'package-lock.json', 'yarn.lock', 'notifications.py', 'page.js']: 
            return []
        
        # Ignorar imagens e binários
        if file_path.endswith(('.png', '.jpg', '.svg', '.exe', '.dll', '.pyc')): return []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 1. Análise Especializada: SQL Injection (Só em ficheiros .py)
            if file_path.endswith('.py'):
                sql_issues = self.check_sql_injection(file_path, content)
                issues.extend(sql_issues)

            # 2. Análise Padrão: Regex (Linha a linha)
            lines = content.splitlines()
            for line_num, line in enumerate(lines, 1):
                if len(line) > 500: continue # Ignora linhas gigantes (minificadas)
                
                for rule in self.regex_rules:
                    if re.search(rule['pattern'], line):
                        # Evita detetar o próprio scanner
                        if 'scanner.py' in file_path: continue
                        
                        issues.append({
                            "file": file_path,
                            "line": line_num,
                            "name": rule['name'],
                            "severity": rule['severity'],
                            "snippet": line.strip()[:100]
                        })
        except Exception:
            pass
            
        return issues

    def scan_directory(self, target_dir):
        """
        Versão Multi-Threaded: Analisa vários ficheiros ao mesmo tempo.
        """
        all_files = []
        ignore_dirs = {'.git', 'venv', 'env', '__pycache__', 'node_modules', '.next', '.vscode'}

        # 1. Listar todos os ficheiros primeiro (rápido)
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                all_files.append(os.path.join(root, file))

        print(f"DEBUG: A iniciar scan paralelo de {len(all_files)} ficheiros...")
        
        results = []
        # 2. Processar em paralelo (usa todos os núcleos do CPU)
        with concurrent.futures.ProcessPoolExecutor() as executor:
            # Mapeia a função scan_file para todos os ficheiros encontrados
            futures = executor.map(self.scan_file, all_files)
            
            for file_issues in futures:
                results.extend(file_issues)
                
        return results

# Mantemos a classe antiga com o nome Scanner para compatibilidade com o teu main.py e api.py
Scanner = SASTScanner