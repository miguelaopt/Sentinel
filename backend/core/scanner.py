import os
import re
import yaml

class Scanner:
    def __init__(self, rules_file="rules.yaml"):
        self.rules = self.load_rules(rules_file)
        # Pastas e ficheiros que devemos ignorar para performance
        self.ignore_dirs = {'.git', 'node_modules', 'venv', '__pycache__', '.idea', 'dist', 'build'}
        self.ignore_exts = {'.png', '.jpg', '.exe', '.dll', '.so', '.pdf', '.zip'}

    def load_rules(self, filepath):
        """Carrega as regras do ficheiro YAML."""
        if not os.path.exists(filepath):
            print(f"Erro: Ficheiro de regras '{filepath}' não encontrado.")
            return []
        
        with open(filepath, 'r') as f:
            data = yaml.safe_load(f)
            return data.get('rules', [])

    def scan_directory(self, target_dir):
        """Percorre a diretoria e aplica as regras."""
        results = []
        
        for root, dirs, files in os.walk(target_dir):
            # Filtrar pastas ignoradas
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in self.ignore_exts):
                    continue
                
                filepath = os.path.join(root, file)
                file_results = self.scan_file(filepath)
                if file_results:
                    results.extend(file_results)
        
        return results

    def scan_file(self, filepath):
        """Analisa um único ficheiro linha a linha."""
        issues = []
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
                for line_num, line in enumerate(lines, 1):
                    for rule in self.rules:
                        if re.search(rule['regex'], line):
                            issues.append({
                                "file": filepath,
                                "line": line_num,
                                "rule_id": rule['id'],
                                "name": rule['name'],
                                "severity": rule['severity'],
                                "snippet": line.strip()[:60]  # Corta linhas muito longas
                            })
        except Exception:
            # Ignora ficheiros que não consegue ler
            pass
            
        return issues