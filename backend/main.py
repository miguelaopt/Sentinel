import sys
import argparse
from colorama import init, Fore, Style
from core.scanner import Scanner
from core.report import generate_json_report  # <--- IMPORT NOVO

# Inicializar cores
init()

def print_banner():
    print(Fore.CYAN + """
   _____            _   _            _ 
  / ____|          | | (_)          | |
 | (___   ___ _ __ | |_ _ _ __   ___| |
  \\___ \\ / _ \\ '_ \\| __| | '_ \\ / _ \\ |
  ____) |  __/ | | | |_| | | | |  __/ |
 |_____/ \\___|_| |_|\\__|_|_| |_|\\___|_|
      Security Scanner v1.0
    """ + Style.RESET_ALL)

def main():
    print_banner()
    
    parser = argparse.ArgumentParser(description="SentinelScan")
    parser.add_argument("path", help="Caminho da pasta a analisar")
    parser.add_argument("--rules", default="rules.yaml", help="Ficheiro de regras")
    # NOVO ARGUMENTO: Onde salvar o JSON
    parser.add_argument("--output", default="report.json", help="Nome do ficheiro de relatório JSON")
    
    args = parser.parse_args()
    
    print(f"{Fore.BLUE}[*] A carregar regras...{Style.RESET_ALL}")
    scanner = Scanner(rules_file=args.rules)
    
    print(f"{Fore.BLUE}[*] A analisar: {args.path}{Style.RESET_ALL}\n")
    results = scanner.scan_directory(args.path)
    
    # Lógica de Display no Terminal
    if not results:
        print(f"{Fore.GREEN}[OK] Código limpo!{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}[!] Encontrados {len(results)} problemas:{Style.RESET_ALL}\n")
        for issue in results:
            color = Fore.RED if issue['severity'] == "CRITICO" else Fore.YELLOW
            print(f"{color}[{issue['severity']}] {issue['name']} {Style.RESET_ALL}")
            print(f"  Ficheiro: {issue['file']} : {issue['line']}")
            print("-" * 30)

    # NOVO: Gerar o Relatório JSON
    print(f"\n{Fore.BLUE}[*] A gerar relatório JSON...{Style.RESET_ALL}")
    if generate_json_report(results, args.output):
        print(f"{Fore.GREEN}[✓] Relatório salvo em: {args.output}{Style.RESET_ALL}")
    
    # Se houver erros críticos, sai com erro (para travar CI/CD no futuro)
    if results:
        sys.exit(1)

if __name__ == "__main__":
    main()