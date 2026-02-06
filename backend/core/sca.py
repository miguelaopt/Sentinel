import json
import re

class SCAScanner:
    def __init__(self):
        # Em produção, isto ligaria a uma DB de CVEs (ex: OSV.dev API)
        # Para demo/MVP, usamos uma lista de "bad versions" conhecidas
        self.vulnerable_packages = {
            "axios": ["0.21.1", "0.19.0"],
            "lodash": ["4.17.15", "4.17.11"],
            "requests": ["2.20.0"],
            "django": ["3.2.0", "2.2.0"],
            "react": ["16.8.0"]
        }

    def scan_package_json(self, content, file_path):
        issues = []
        try:
            data = json.loads(content)
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            
            for pkg, version in deps.items():
                # Limpar caracteres como ^ ou ~ (ex: ^1.2.3 -> 1.2.3)
                clean_ver = re.sub(r'[^\d.]', '', version)
                
                if pkg in self.vulnerable_packages:
                    if clean_ver in self.vulnerable_packages[pkg]:
                        issues.append({
                            "id": "VULNERABLE_DEP",
                            "file": file_path,
                            "line": 0, # JSON não é fácil mapear linha sem parser custom
                            "name": f"SCA: {pkg} v{clean_ver} is vulnerable",
                            "severity": "ALTO",
                            "snippet": f'"{pkg}": "{version}"'
                        })
        except:
            pass
        return issues

    def scan_requirements_txt(self, content, file_path):
        issues = []
        for i, line in enumerate(content.splitlines(), 1):
            if "==" in line:
                parts = line.split("==")
                pkg = parts[0].strip().lower()
                ver = parts[1].strip()
                
                if pkg in self.vulnerable_packages and ver in self.vulnerable_packages[pkg]:
                    issues.append({
                        "id": "VULNERABLE_DEP",
                        "file": file_path,
                        "line": i,
                        "name": f"SCA: {pkg} v{ver} is vulnerable",
                        "severity": "ALTO",
                        "snippet": line.strip()
                    })
        return issues