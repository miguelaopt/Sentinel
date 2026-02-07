import os
import re
import yaml
from .security import analyze_security, analyze_secrets  # Funções auxiliares
from .compliance import check_compliance

# Carregar regras
RULES_PATH = os.path.join(os.path.dirname(__file__), "../rules.yaml")

class Scanner:
    def __init__(self):
        with open(RULES_PATH, "r") as f:
            self.rules = yaml.safe_load(f)
        
        # Lista de pastas a ignorar
        self.IGNORE_DIRS = {
            '.git', '.svn', '.hg', '.idea', '.vscode', 
            'node_modules', 'venv', '.venv', 'env', 
            '__pycache__', 'dist', 'build', 'sentinel_uploads',
            'migrations', 'tests'
        }

        # Lista de ficheiros a ignorar (configurações do próprio Sentinel)
        self.IGNORE_FILES = {
            'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
            'composer.lock', 'Cargo.lock', '.DS_Store',
            'docker-compose.yml', 'docker-compose.yaml', # Ignora o compose do sistema
            '.env', '.env.local', '.env.example',       # Ignora variáveis de ambiente
            'rules.yaml', 'requirements.txt'
        }

    async def scan_directory(self, directory: str):
        issues = []
        
        # Normalizar caminho
        directory = os.path.abspath(directory)

        for root, dirs, files in os.walk(directory):
            # Filtrar diretórios ignorados
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS]
            
            for file in files:
                if file in self.IGNORE_FILES:
                    continue

                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, directory)
                
                # Ignorar ficheiros muito grandes (> 1MB) para performance
                if os.path.getsize(file_path) > 1 * 1024 * 1024:
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        
                        # 1. Análise de Segurança (Regex)
                        sec_issues = analyze_security(content, self.rules)
                        for issue in sec_issues:
                            issue.file = relative_path
                            issues.append(issue)

                        # 2. Análise de Segredos (Entropy/Regex específico)
                        secret_issues = analyze_secrets(content)
                        for issue in secret_issues:
                            issue.file = relative_path
                            issues.append(issue)

                except Exception as e:
                    print(f"Erro ao ler {relative_path}: {e}")

        # 3. Análise de Compliance (GDPR, etc.)
        compliance_issues = check_compliance(issues)
        issues.extend(compliance_issues)

        return issues