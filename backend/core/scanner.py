import os
import re
from .sca import SCAScanner
from .iac import IaCScanner
from .compliance import check_compliance
from .security import analyze_security, analyze_secrets, Issue
import yaml

# Caminho para o ficheiro rules.yaml
RULES_PATH = os.path.join(os.path.dirname(__file__), "../rules.yaml")

class Scanner:
    def __init__(self):
        # Carregar regras do YAML se existir, senão usa lista vazia
        self.regex_rules = []
        if os.path.exists(RULES_PATH):
            try:
                with open(RULES_PATH, "r") as f:
                    self.regex_rules = yaml.safe_load(f)
            except Exception as e:
                print(f"Erro ao carregar rules.yaml: {e}")

        # Inicializar sub-scanners
        self.sca = SCAScanner()
        self.iac = IaCScanner()
        
        # Pastas a ignorar
        self.IGNORE_DIRS = {'.git', '.svn', 'node_modules', 'venv', '.venv', '__pycache__', '.next', 'dist', 'build'}

    async def scan_file(self, file_path, policies=None):
        issues = []
        if not policies: policies = {"dockerScan": True}
        
        filename = os.path.basename(file_path)

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 1. SCA (Dependências)
            if filename == 'package.json':
                # Nota: SCA retorna dicts, convertemos para Issue se necessário
                raw_issues = self.sca.scan_package_json(content, file_path)
                for i in raw_issues:
                    issues.append(Issue(i['id'], i['name'], i['severity'], i['snippet'], i['line'], file_path))
                    
            elif filename == 'requirements.txt':
                raw_issues = self.sca.scan_requirements_txt(content, file_path)
                for i in raw_issues:
                    issues.append(Issue(i['id'], i['name'], i['severity'], i['snippet'], i['line'], file_path))

            # 2. IaC (Infraestrutura)
            if filename == 'Dockerfile' and policies.get('dockerScan'):
                raw_issues = self.iac.scan_dockerfile(content, file_path)
                for i in raw_issues:
                    issues.append(Issue(i['id'], i['name'], i['severity'], i['snippet'], i['line'], file_path))

            # 3. SAST (Análise de Segurança Avançada)
            # Usa as funções do security.py corrigido
            security_issues = analyze_security(content, self.regex_rules)
            for issue in security_issues:
                issue.file = file_path
                issues.append(issue)

            # 4. Segredos (Entropia)
            secret_issues = analyze_secrets(content)
            for issue in secret_issues:
                issue.file = file_path
                issues.append(issue)

        except Exception as e:
            # print(f"Erro ao ler {file_path}: {e}")
            pass

        return issues

    async def scan_directory(self, target_dir, policies=None):
        all_issues = []
        
        for root, dirs, files in os.walk(target_dir):
            # Filtrar pastas ignoradas
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS]
            
            for file in files:
                file_path = os.path.join(root, file)
                # Ignorar ficheiros do próprio scanner para evitar falsos positivos
                if "security_report.json" in file or "rules.yaml" in file:
                    continue
                    
                file_issues = await self.scan_file(file_path, policies)
                all_issues.extend(file_issues)
        
        # 5. Compliance Check (Global)
        # Verifica se os erros encontrados violam ISO 27001, GDPR, etc.
        compliance_issues = check_compliance(all_issues)
        all_issues.extend(compliance_issues)

        return all_issues