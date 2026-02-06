import os
import time
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
    console.print(Align.center("[bold white on purple]  SENTINEL USER MANAGER  [/bold white on purple]"))
    console.print("\n")

def sudo_check():
    """Verifica permissão"""
    console.print("\n[bold red]🔒 SUDO REQUIRED[/bold red]")
    password = Prompt.ask("Password de Administrador", password=True)
    
    current_pass = os.environ.get("ADMIN_SUDO_PASSWORD", "sentinel")
    
    if password == current_pass:
        console.print("[green]✓ Acesso Autorizado[/green]\n")
        return True
    else:
        console.print("[bold red]✗ Acesso Negado![/bold red]")
        time.sleep(2)
        return False

def update_env_password(new_password):
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
            
        os.environ["ADMIN_SUDO_PASSWORD"] = new_password
        return True
    except Exception as e:
        console.print(f"[red]Erro ao escrever no .env: {e}[/red]")
        return False

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
        console.print(f"[bold green]✅ Password atualizada![/bold green]")
    else:
        console.print("[red]Falha ao atualizar password.[/red]")
    time.sleep(2)

# --- FUNÇÕES DE LISTAGEM ---

def list_users(pause=True):
    try:
        # Simplificado: Não faz join com organizações
        res = supabase.table("profiles").select("*").execute()
        
        table = Table(title="Utilizadores do Sistema", border_style="purple")
        table.add_column("ID", style="dim", no_wrap=True)
        table.add_column("Nome", style="cyan")
        table.add_column("Email", style="green")
        table.add_column("Role", style="magenta")
        table.add_column("Contacto", style="yellow") # Adicionado contacto visual

        for u in res.data:
            role_style = "[bold red]Admin[/bold red]" if u['role'] == 'Admin' else u['role']
            table.add_row(
                u['id'], 
                u['full_name'], 
                u['email'], 
                role_style,
                f"mailto:{u['email']}"
            )
        console.print(table)
    except Exception as e: console.print(f"[red]Erro: {e}[/red]")
    if pause: Prompt.ask("\n[dim]Enter para voltar...[/dim]")

# --- FUNÇÕES DE AÇÃO ---

def add_user():
    print_banner()
    console.print("[bold green]>>> ADICIONAR USER[/bold green]")
    
    # Não pede Organização. O sistema cria automaticamente.
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)
    name = Prompt.ask("Nome Completo")
    role = Prompt.ask("Cargo", choices=["Viewer", "Developer", "Admin"], default="Viewer")

    if not sudo_check(): return

    try:
        console.print("[dim]Criando utilizador...[/dim]")
        
        # Envia apenas o necessário. O Trigger na DB trata do resto.
        supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": name,
                "role": role
                # org_id foi removido. O SQL vai criar uma org pessoal automática.
            }
        })
        
        console.print(f"[bold green]✅ Utilizador {email} criado com sucesso![/bold green]")
        time.sleep(2)
        
    except Exception as e:
        console.print(f"[bold red]Erro ao criar user: {e}[/bold red]")
        time.sleep(4)

def remove_user():
    print_banner()
    list_users(pause=False)
    console.print("\n[bold red]>>> REMOVER USER[/bold red]")
    uid = Prompt.ask("ID do User para APAGAR")
    
    if not sudo_check(): return

    try:
        supabase.auth.admin.delete_user(uid)
        console.print("[bold green]✅ Utilizador removido permanentemente![/bold green]")
    except Exception as e: 
        console.print(f"[red]Erro: {e}[/red]")
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
        menu.add_row("", "")
        menu.add_row("[3]", "Listar Users")
        menu.add_row("", "")
        menu.add_row("[4]", "[yellow]Mudar Password Sudo[/yellow]")
        menu.add_row("[0]", "[red]Sair[/red]")

        console.print(Panel(menu, title="Menu de Comando", border_style="purple", expand=False))

        choice = Prompt.ask("Selecione", choices=["1", "2", "3", "4", "0"])

        if choice == "1": add_user()
        elif choice == "2": remove_user()
        elif choice == "3": 
            print_banner()
            list_users()
        elif choice == "4": change_sudo_password()
        elif choice == "0": break

if __name__ == "__main__":
    main_menu()