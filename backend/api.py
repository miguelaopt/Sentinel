import argparse
import asyncio
import os
import sys
from core.scanner import Scanner
from core.report import generate_json_report, save_to_supabase
from supabase import create_client

# Configurações
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # No CLI local, usa-se a chave direta ou envia-se para a API

def resolve_owner(api_key):
    """Descobre o ID do utilizador/org baseada na API Key"""
    if not api_key or not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Procura a chave na tabela api_keys
        response = supabase.table("api_keys").select("user_id").eq("key_value", api_key).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]['user_id']
    except Exception as e:
        print(f"⚠️ Erro ao validar API Key: {e}")
    return None

async def main():
    parser = argparse.ArgumentParser(description="SentinelScan CLI")
    parser.add_argument("directory", help="Diretório para analisar")
    parser.add_argument("--output", help="Ficheiro de saída (JSON)", default="security_report.json")
    parser.add_argument("--api-key", help="Chave de API do Sentinel Dashboard", default=os.getenv("SENTINEL_API_KEY"))
    
    args = parser.parse_args()

    print("\n╭──────────────────────────────╮")
    print("│ SentinelScan Enterprise v1.0 │")
    print("│ Secure Code Scanner          │")
    print("╰──────────────────────────────╯")

    if not os.path.exists(args.directory):
        print(f"❌ Erro: Diretório '{args.directory}' não encontrado.")
        sys.exit(1)

    print(f"🔎 A analisar diretório: {args.directory}")

    # 1. Executar Scan
    scanner = Scanner()
    issues = await scanner.scan_directory(args.directory)
    
    # 2. Gerar Relatório Local
    report = generate_json_report(issues)
    with open(args.output, "w") as f:
        f.write(report)
    
    # 3. Enviar para a Cloud (Se houver API Key)
    user_id = resolve_owner(args.api_key)
    
    if user_id:
        print("☁️  A sincronizar com Sentinel Cloud...")
        # Adiciona o user_id ao relatório antes de enviar
        scan_data = {
            "total_issues": len(issues),
            "issues": [i.dict() for i in issues],
            "summary": {"critical": len([i for i in issues if i.severity == 'CRITICO']), 
                        "high": len([i for i in issues if i.severity == 'ALTO']), 
                        "medium": len([i for i in issues if i.severity == 'MEDIO'])},
            "user_id": user_id # <--- O SEGREDO ESTÁ AQUI
        }
        
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            supabase.table("scans").insert({"report": scan_data, "user_id": user_id}).execute()
            print("✅ Relatório disponível no Dashboard!")
        except Exception as e:
            print(f"❌ Falha no upload: {e}")
    else:
        print("ℹ️  Modo Offline (Sem API Key válida). Relatório apenas local.")

    # Resumo Final
    critical_count = len([i for i in issues if i.severity == 'CRITICO'])
    if critical_count > 0:
        print(f"\n❌ SCAN FALHOU: {critical_count} problemas Críticos encontrados.")
        sys.exit(1)
    else:
        print("\n✅ SCAN APROVADO: Código seguro.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())