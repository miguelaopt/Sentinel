import json
import os
from datetime import datetime
from supabase import create_client, Client

def generate_json_report(issues, output_file="report.json"):
    # 1. Preparar os dados
    report_data = {
        "scan_timestamp": datetime.now().isoformat(),
        "total_issues": len(issues),
        "issues": issues,
        "summary": {
            "critical": len([i for i in issues if i['severity'] == 'CRITICO']),
            "high": len([i for i in issues if i['severity'] == 'ALTO']),
            "medium": len([i for i in issues if i['severity'] == 'MEDIO']),
        }
    }

    # 2. Gravar localmente (Backup)
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=4, ensure_ascii=False)
        print(f"Relatório local salvo em {output_file}")
    except Exception as e:
        print(f"Erro local: {e}")

    # 3. Enviar para o Supabase (Cloud)
    # Só tenta enviar se tivermos as chaves configuradas
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if url and key:
        try:
            supabase: Client = create_client(url, key)
            # Inserir na tabela 'scans' na coluna 'report'
            data = supabase.table("scans").insert({"report": report_data}).execute()
            print("✅ Relatório enviado para o Supabase com sucesso!")
            return True
        except Exception as e:
            print(f"❌ Erro ao enviar para Supabase: {e}")
            return False
    else:
        print("⚠️ Chaves do Supabase não encontradas. A gravar apenas localmente.")
        return True