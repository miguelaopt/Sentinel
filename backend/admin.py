import os
import time
from dotenv import load_dotenv # <--- O SEGREDO ESTÁ AQUI
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich import print
from supabase import create_client

# 1. Carregar variáveis do ficheiro .env ou .env.local
load_dotenv() 

# 2. Configuração
URL = os.environ.get("SUPABASE_URL")
# Tenta apanhar a Service Key, se não der, tenta a Anon Key (mas a Anon não deixa apagar users)
KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

console = Console()

def get_supabase():
    if not URL or not KEY:
        console.clear()
        console.print(Panel.fit("[bold red]❌ ERRO FATAL[/bold red]", border_style="red"))
        console.print("[red]Não foi possível ler as variáveis de ambiente.[/red]")
        console.print(f"URL encontrada: {URL}")
        console.print(f"KEY encontrada: {'Sim (Oculta)' if KEY else 'Não'}")
        console.print("\n[yellow]Dica: Instale 'pip install python-dotenv' e garanta que tem um ficheiro .env[/yellow]")
        exit(1)
    return create_client(URL, KEY)

supabase = get_supabase()

def print_header():
    console.clear()
    console.print(Panel(
        "[bold cyan]SENTINEL CORE[/bold cyan]\n[dim]ADMINISTRATION CONSOLE v2.0[/dim]",
        style="bold white on black",
        border_style="cyan",
        expand=False
    ))

def list_users():
    try:
        response = supabase.table("profiles").select("*").execute()
        users = response.data
        table = Table(title="👥 OPERADORES ATIVOS", border_style="cyan", header_style="bold magenta")
        table.add_column("ID", style="dim", width=8)
        table.add_column("Email", style="bold white")
        table.add_column("Nome")
        table.add_column("Cargo")
        
        for user in users:
            table.add_row(user['id'][:8], user['email'], user['full_name'], user['role'])
        console.print(table)
    except Exception as e:
        console.print(f"[red]Erro ao listar: {e}[/red]")

def add_user_flow():
    console.print("\n[bold green]>>> PROTOCOLO DE ADMISSÃO[/bold green]")
    email = Prompt.ask("[cyan]Email[/cyan]")
    password = Prompt.ask("[cyan]Password[/cyan]", password=True)
    name = Prompt.ask("[cyan]Nome[/cyan]")
    role = Prompt.ask("[cyan]Cargo[/cyan]", choices=["Viewer", "Developer", "Admin"], default="Viewer")
    
    console.print(f"\n[yellow]CONFIRMAÇÃO:[/yellow] Criar {email} como {role}?")
    confirm = Prompt.ask("[bold white]Digite 'sudo add user' para confirmar[/bold white]")
    
    if confirm == "sudo add user":
        with console.status("[bold green]A injetar dados na mainframe...[/bold green]", spinner="dots"):
            try:
                # 1. Auth
                res = supabase.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": name}
                })
                # 2. Profile update
                if res.user:
                    supabase.table("profiles").update({"role": role}).eq("id", res.user.id).execute()
                    console.print(f"[bold green]✅ OPERADOR REGISTADO COM SUCESSO.[/bold green]")
                    time.sleep(2)
            except Exception as e:
                console.print(f"[bold red]❌ FALHA NO PROCESSO:[/bold red] {e}")
    else:
        console.print("[red]⛔ Acesso negado. Comando incorreto.[/red]")
        time.sleep(1)

def remove_user_flow():
    console.print("\n[bold red]>>> PROTOCOLO DE EXPULSÃO[/bold red]")
    list_users()
    target = Prompt.ask("\n[cyan]Email do alvo[/cyan]")
    
    # Buscar ID
    res = supabase.table("profiles").select("id").eq("email", target).execute()
    if not res.data:
        console.print("[red]Alvo não encontrado.[/red]")
        time.sleep(2)
        return

    uid = res.data[0]['id']
    confirm = Prompt.ask(f"[bold red]Digite 'sudo remove user' para ELIMINAR {target}[/bold red]")
    
    if confirm == "sudo remove user":
        with console.status("[bold red]A eliminar registos...[/bold red]"):
            try:
                supabase.auth.admin.delete_user(uid)
                console.print("[bold green]✅ ALVO ELIMINADO.[/bold green]")
                time.sleep(2)
            except Exception as e:
                console.print(f"[bold red]❌ ERRO:[/bold red] {e}")
    else:
        console.print("[red]⛔ Cancelado.[/red]")
        time.sleep(1)

def main():
    while True:
        print_header()
        console.print("\n[1] Adicionar Operador  [2] Remover Operador  [3] Listar  [0] Sair")
        choice = Prompt.ask("\n[bold cyan]root@sentinel:~$[/bold cyan]", choices=["1", "2", "3", "0"])
        
        if choice == "1": add_user_flow()
        elif choice == "2": remove_user_flow()
        elif choice == "3": 
            list_users()
            Prompt.ask("\n[dim]Enter para continuar...[/dim]")
        elif choice == "0": break

if __name__ == "__main__":
    main()