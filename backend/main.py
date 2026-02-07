import argparse
import sys
import time
import asyncio  # <--- Importante
from core.scanner import Scanner
from core.report import generate_json_report
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from core.notifications import send_alert

console = Console()

async def main():  # <--- Agora é async
    # 1. Configuração de Argumentos CLI
    parser = argparse.ArgumentParser(description="SentinelScan Enterprise Edition")
    parser.add_argument("directory", help="Diretório para analisar")
    parser.add_argument("--output", default="security_report.json", help="Ficheiro de saída JSON")
    args = parser.parse_args()

    # 2. Intro Visual
    console.print(Panel.fit("[bold cyan]SentinelScan Enterprise v1.0[/bold cyan]\n[dim]Secure Code Scanner[/dim]", border_style="cyan"))

    scanner = Scanner()
    
    # 3. Análise com Barra de Progresso
    console.print(f"[bold]🔎 A analisar diretório:[/bold] {args.directory}")
    
    with console.status("[bold green]A verificar ficheiros...[/bold green]", spinner="dots"):
        time.sleep(1) 
        # <--- O AWAIT é obrigatório aqui porque o scan é assíncrono
        issues = await scanner.scan_directory(args.directory)

    # 4. Mostrar Resultados em Tabela
    if issues:
        table = Table(title="⚠️ Vulnerabilidades Detetadas", show_header=True, header_style="bold white")
        table.add_column("Gravidade", style="dim", width=12)
        table.add_column("Tipo", min_width=20)
        table.add_column("Localização", min_width=30)

        critical_count = 0

        for issue in issues:
            # Colorir conforme a gravidade
            severity_color = "red" if issue.severity == "CRITICO" else "yellow" if issue.severity == "ALTO" else "blue"
            
            if issue.severity == "CRITICO":
                critical_count += 1
                
            loc = f"{issue.file}:{issue.line}"
            table.add_row(f"[{severity_color}]{issue.severity}[/{severity_color}]", issue.name, loc)

        console.print(table)
        
        console.print(f"\n[bold red]❌ SCAN FALHOU:[/bold red] Foram encontrados {len(issues)} problemas ({critical_count} Críticos).")
    else:
        console.print(Panel("[bold green]✅ Nenhuma vulnerabilidade encontrada. Código Seguro![/bold green]", border_style="green"))

    # 5. Gerar Relatório
    console.print("\n[dim]📄 A gerar relatórios...[/dim]")
    # Converter objetos Issue para dicionários antes de gerar JSON
    issues_dict = [i.dict() for i in issues]
    success = generate_json_report(issues_dict, args.output)
    
    if success:
        console.print("[bold green]☁️  Dados sincronizados com Sentinel Cloud![/bold green]")

    if issues:
        console.print("\n[dim]📧 A verificar necessidade de alertas...[/dim]")
        # (Opcional) send_alert(issues) - descomentar se notifications.py estiver configurado
    
    # Código de saída
    sys.exit(1 if issues else 0)

if __name__ == "__main__":
    try:
        asyncio.run(main()) # <--- Inicia o loop assíncrono
    except KeyboardInterrupt:
        print("\nScan cancelado pelo utilizador.")
        sys.exit(0)