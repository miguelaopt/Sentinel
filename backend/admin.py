import os
import time
import re
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.align import Align
from rich import print
from supabase import create_client

# Carregar variáveis
load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

console = Console()

# --- SEGURANÇA: Ler password do .env ---
# Se não existir no .env, usa "sentinel" por defeito
SUDO_PASSWORD = os.environ.get("ADMIN_SUDO_PASSWORD", "sentinel")

if not URL or not KEY:
    console.print("[bold red]❌ ERRO CRÍTICO:[/bold red] Faltam chaves no .env")
    exit(1)

supabase = create_client(URL, KEY)

BANNER = r"""
________  _______   ________   _________  ___  ________   _______   ___          
|\   ____\|\  ___ \ |\   ___  \|\___   ___\\  \|\   ___  \|\  ___ \ |\  \         
\ \  \___|\ \   __/|\ \  \\ \  \|___ \  \_\ \  \ \  \\ \  \ \   __/|\ \  \        
 \ \_____  \ \  \_|/_\ \  \\ \  \   \ \  \ \ \  \ \  \\ \  \ \  \_|/_\ \  \       
  \|____|\  \ \  \_|\ \ \  \\ \  \   \ \  \ \ \  \ \  \\ \  \ \  \_|\ \ \  \____  
    ____\_\  \ \_______\ \__\\ \__\   \ \__\ \ \__\ \__\\ \__\ \_______\ \_______\
   |\_________\|_______|\|__| \|__|    \|__|  \|__|\|__| \|__|\|_______|\|_______|
   \|_________|                                                                   
"""

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_banner():
    clear_screen()
    console.print(Align.center(f"[bold purple]{BANNER}[/bold purple]"))
    console.print(Align.center("[bold white on purple]  SENTINEL SCAN ADMIN PANEL  [/bold white on purple]"))
    console.print("\n")

def sudo_check():
    """Verifica permissão"""
    console.print("\n[bold red]🔒 SUDO REQUIRED[/bold red]")
    password = Prompt.ask("Password de Administrador", password=True)
    
    # Recarrega a varável para garantir que temos a versão mais recente
    current_pass = os.environ.get("ADMIN_SUDO_PASSWORD", "sentinel")
    
    if password == current_pass:
        console.print("[green]✓ Acesso Autorizado[/green]\n")
        return True
    else:
        console.print("[bold red]✗ Acesso Negado![/bold red]")
        time.sleep(2)
        return False

def update_env_password(new_password):
    """Reescreve o ficheiro .env com a nova password"""
    env_path = ".env"
    try:
        with open(env_path, "r") as f:
            lines = f.readlines()
        
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("ADMIN_SUDO_PASSWORD="):
                new_lines.append(f'ADMIN_SUDO_PASSWORD="{new_password}"\n')
                found = True
            else:
                new_lines.append(line)
        
        if not found:
            new_lines.append(f'\nADMIN_SUDO_PASSWORD="{new_password}"\n')
            
        with open(env_path, "w") as f:
            f.writelines(new_lines)
            
        # Atualiza a variável no processo atual também
        os.environ["ADMIN_SUDO_PASSWORD"] = new_password
        return True
    except Exception as e:
        console.print(f"[red]Erro ao escrever no .env: {e}[/red]")
        return False

# --- NOVA FUNCIONALIDADE: MUDAR PASSWORD ---
def change_sudo_password():
    print_banner()
    console.print("[bold yellow]>>> ALTERAR PASSWORD SUDO[/bold yellow]")
    
    if not sudo_check(): return

    new_pass = Prompt.ask("Nova Password", password=True)
    confirm_pass = Prompt.ask("Confirme a Password", password=True)

    if new_pass != confirm_pass:
        console.print("[red]As passwords não coincidem![/red]")
        time.sleep(2)
        return

    if update_env_password(new_pass):
        console.print(f"[bold green]✅ Password atualizada no ficheiro .env![/bold green]")
        console.print("[dim]A nova password entra em vigor imediatamente.[/dim]")
    else:
        console.print("[red]Falha ao atualizar password.[/red]")
    
    time.sleep(3)

# --- FUNÇÕES EXISTENTES (Simplificadas para poupar espaço, mantêm a lógica anterior) ---

def list_users(pause=True):
    try:
        res = supabase.table("profiles").select("*, organizations(name)").execute()
        table = Table(title="Utilizadores", border_style="purple")
        table.add_column("ID", style="dim", no_wrap=True)
        table.add_column("Nome", style="cyan")
        table.add_column("Email", style="green")
        table.add_column("Role", style="magenta")
        table.add_column("Org", style="yellow")
        for u in res.data:
            org = u['organizations']['name'] if u.get('organizations') else "N/A"
            table.add_row(u['id'], u['full_name'], u['email'], u['role'], org)
        console.print(table)
    except Exception as e: console.print(f"[red]{e}[/red]")
    if pause: Prompt.ask("\n[dim]Enter para voltar...[/dim]")

def list_organizations(pause=True):
    try:
        res = supabase.table("organizations").select("*").execute()
        table = Table(title="Organizações", border_style="blue")
        table.add_column("ID", style="dim")
        table.add_column("Nome", style="cyan")
        for org in res.data: table.add_row(org['id'], org['name'])
        console.print(table)
    except Exception as e: console.print(f"[red]{e}[/red]")
    if pause: Prompt.ask("\n[dim]Enter para voltar...[/dim]")

def add_organization():
    print_banner()
    console.print("[green]ADD ORG[/green]")
    name = Prompt.ask("Nome")
    if sudo_check():
        try:
            supabase.table("organizations").insert({"name": name}).execute()
            console.print("[green]Sucesso![/green]")
        except Exception as e: console.print(f"[red]{e}[/red]")
        time.sleep(2)

def remove_organization():
    print_banner()
    list_organizations(pause=False)
    console.print("[red]REMOVE ORG[/red]")
    oid = Prompt.ask("ID")
    if sudo_check():
        try:
            supabase.table("organizations").delete().eq("id", oid).execute()
            console.print("[green]Removido![/green]")
        except Exception as e: console.print(f"[red]{e}[/red]")
        time.sleep(2)

def add_user():
    print_banner()
    console.print("[bold green]>>> ADICIONAR USER[/bold green]")
    
    console.print("Selecione a Organização (Opcional - Enter para criar nova automática):")
    # Nota: Simplifiquei aqui. Se deres Enter, o trigger cria uma org nova.
    # Se quiseres forçar uma org existente, terias de passar o ID no metadata também,
    # mas vamos deixar o trigger gerir a org para simplificar.
    
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)
    name = Prompt.ask("Nome Completo")
    role = Prompt.ask("Cargo", choices=["Viewer", "Developer", "Admin"], default="Viewer")

    if not sudo_check(): return

    try:
        console.print("[dim]Criando utilizador...[/dim]")
        
        # --- A CORREÇÃO ESTÁ AQUI ---
        # Passamos o role dentro de user_metadata
        auth_res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": name,
                "role": role  # <--- O Trigger vai ler isto!
            }
        })
        
        console.print(f"[bold green]✅ Utilizador {email} criado com sucesso como {role}![/bold green]")
        time.sleep(2)
        
    except Exception as e:
        console.print(f"[bold red]Erro ao criar user: {e}[/bold red]")
        time.sleep(4)

def remove_user():
    print_banner()
    list_users(pause=False)
    uid = Prompt.ask("ID do User")
    if sudo_check():
        try:
            supabase.auth.admin.delete_user(uid)
            console.print("[green]User Removido![/green]")
        except Exception as e: console.print(f"[red]{e}[/red]")
        time.sleep(2)

# --- MENU PRINCIPAL ---

def main_menu():
    while True:
        print_banner()
        
        menu = Table.grid(padding=1)
        menu.add_column(style="bold cyan", justify="right")
        menu.add_column(style="white")

        menu.add_row("[1]", "Adicionar User")
        menu.add_row("[2]", "Remover User")
        menu.add_row("[3]", "Adicionar Organização")
        menu.add_row("[4]", "Remover Organização")
        menu.add_row("", "")
        menu.add_row("[5]", "Listar Users")
        menu.add_row("[6]", "Listar Organizações")
        menu.add_row("", "")
        menu.add_row("[7]", "[yellow]Mudar Password Sudo[/yellow]")
        menu.add_row("[0]", "[red]Sair[/red]")

        console.print(Panel(menu, title="Menu de Comando", border_style="purple", expand=False))

        choice = Prompt.ask("Selecione", choices=["1", "2", "3", "4", "5", "6", "7", "0"])

        if choice == "1": add_user()
        elif choice == "2": remove_user()
        elif choice == "3": add_organization()
        elif choice == "4": remove_organization()
        elif choice == "5": 
            print_banner()
            list_users()
        elif choice == "6": 
            print_banner()
            list_organizations()
        elif choice == "7": change_sudo_password()
        elif choice == "0": break

if __name__ == "__main__":
    main_menu()