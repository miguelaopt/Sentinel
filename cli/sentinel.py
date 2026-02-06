import os
import sys
import requests
import zipfile
import argparse
import json

# URL da tua API em produção (Render)
API_URL = "https://sentinel-api-rr8s.onrender.com"

def zip_code(source_dir, output_filename="source.zip"):
    print(f"📦 Zipping source code from: {source_dir}")
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Ignorar pastas pesadas/inúteis
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'venv', '__pycache__']]
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
    return output_filename

def run_scan(api_key, zip_file, project_name):
    print("🚀 Uploading to Sentinel Cloud...")
    url = f"{API_URL}/scan"
    
    # Simular policies default para CI/CD
    policies = {"dockerScan": True, "activeValidation": False, "blockCritical": True}
    
    with open(zip_file, 'rb') as f:
        files = {'file': (zip_file, f, 'application/zip')}
        data = {'policies_json': json.dumps(policies)}
        # headers = {'Authorization': f'Bearer {api_key}'} # Futuro: Autenticação por API Key
        
        try:
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection Error: {e}")
            sys.exit(1)

def print_report(report):
    print("\n" + "="*40)
    print(f"🛡️  SENTINEL SCAN REPORT")
    print("="*40)
    
    summary = report.get('summary', {})
    print(f"🔴 Critical: {summary.get('critical', 0)}")
    print(f"🟠 High:     {summary.get('high', 0)}")
    print(f"🔵 Medium:   {summary.get('medium', 0)}")
    print("-" * 40)
    
    if report.get('issues'):
        print("\n🔍 TOP ISSUES FOUND:")
        for issue in report['issues'][:5]: # Mostra apenas os top 5 no terminal
            print(f"[{issue['severity']}] {issue['name']}")
            print(f"   File: {issue['file']} (Line {issue['line']})")
            if 'compliance' in issue:
                comp = issue['compliance']
                print(f"   Compliance: {comp['standard']} - {comp['control']}")
            print("")
    
    print(f"📄 Full report available in dashboard.")
    print("="*40)

    # Lógica de CI/CD: Falhar o build se houver críticos
    if summary.get('critical', 0) > 0:
        print("❌ BUILD FAILED: Critical vulnerabilities detected.")
        sys.exit(1) # Código de erro para parar o Jenkins/GitHub Actions
    else:
        print("✅ Scan Passed. Security clearance granted.")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Sentinel CI/CD Scanner')
    parser.add_argument('--path', type=str, default='.', help='Path to source code')
    parser.add_argument('--key', type=str, help='API Key', required=False) # Opcional por enquanto
    args = parser.parse_args()

    zip_name = zip_code(args.path)
    try:
        report = run_scan(args.key, zip_name, "CI_Build")
        print_report(report)
    finally:
        if os.path.exists(zip_name):
            os.remove(zip_name)