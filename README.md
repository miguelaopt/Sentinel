# 🛡️ Sentinel - Enterprise Secure Code Scanner

![Sentinel Dashboard](https://img.shields.io/badge/Security-Enterprise-blue?style=for-the-badge&logo=shield)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)

O **Sentinel** é uma plataforma SAST (Static Application Security Testing) híbrida desenhada para equipas modernas. Analisa código em busca de vulnerabilidades, segredos expostos e falhas de conformidade, centralizando tudo num Dashboard moderno.

---

## 🌍 O Ecossistema Sentinel

O Sentinel não é apenas um scanner; é uma plataforma completa de gestão de risco.

### 🧩 Porquê a Integração com JIRA?
O Sentinel integra-se nativamente com o **Jira Software** para fechar o ciclo de segurança.
1.  **Detetar:** O Sentinel encontra uma falha crítica (ex: Chave AWS exposta).
2.  **Reportar:** O sistema abre automaticamente um *Ticket* (Bug) no Jira da equipa.
3.  **Resolver:** O programador recebe a tarefa no seu fluxo de trabalho normal, corrige o código e fecha o ticket.

Isto garante que **nenhuma vulnerabilidade é esquecida** num relatório PDF perdido.

---

## 🚀 Funcionalidades Principais

* **🔍 Scan Profundo:** Deteta chaves de API, vulnerabilidades OWASP e erros de configuração Docker/IaC.
* **🤖 AI Remediation:** Integração com Google Gemini para sugerir código corrigido automaticamente.
* **📊 Dashboard Centralizado:** Visualização gráfica de riscos, tendências e conformidade (GDPR, SOC2).
* **⚡ Arquitetura Assíncrona:** Utiliza Redis e Celery para processar grandes volumes de código.
* **🐳 Docker Ready:** Instalação "Plug & Play" com contentores isolados.

---

## ⚙️ Pré-requisitos

Para rodar este projeto, apenas precisas de:
1.  [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Instalado e a correr).
2.  [Git](https://git-scm.com/) (Para descarregar o código).

---

## 📦 Instalação Passo a Passo

### 1. Clonar o Projeto
```bash
git clone [https://github.com/O-TEU-USER/Sentinel.git](https://github.com/O-TEU-USER/Sentinel.git)
cd Sentinel
```
---

### 2. Configurar Segredos (.env)

Cria um ficheiro chamado .env na raiz do projeto (ao lado do docker-compose.yml) e cola as tuas chaves:

# --- Backend & Base de Dados ---
SUPABASE_URL="[https://teu-projeto.supabase.co](https://teu-projeto.supabase.co)"
SUPABASE_SERVICE_ROLE_KEY="tua-chave-secreta-service-role"
ADMIN_SUDO_PASSWORD="sentinel_admin"

# --- Inteligência Artificial (Opcional) ---
GEMINI_API_KEY="tua-chave-google-ai"

# --- Frontend (Público) ---
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL="[https://teu-projeto.supabase.co](https://teu-projeto.supabase.co)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tua-chave-publica-anon"

---

### 3. Iniciar o Servidor

No terminal, na pasta do projeto, executa:
```bash
docker-compose up --build
```
Aguarda alguns minutos. Quando vires mensagens como Uvicorn running e Ready in ... ms no terminal, o sistema está pronto.

---

## 🖥️ Como Usar

### 1️⃣ Aceder ao Dashboard
Abre o browser em: **http://localhost:3000**
* Faz login com as tuas credenciais.
* Aqui podes ver todos os scans, gerir a equipa, configurar o Jira e ver gráficos de segurança.

### 2️⃣ Executar Scans (Modo Developer)
Existem duas formas de analisar código:

#### Opção A: Upload Manual (Simples)
Arrasta um ficheiro `.zip` contendo o código fonte para a área de upload no Dashboard. O resultado aparece na hora.

#### Opção B: Scan Local via Terminal (Profissional)
Podes analisar código no teu computador sem fazer upload, usando o Docker CLI. Isto permite que o código nunca saia da tua máquina, mas o relatório é enviado para o Dashboard central.

1.  Vai ao Dashboard > **Settings** e gera uma **API Key**.
2.  Abre o terminal na pasta do código que queres analisar.
3.  Corre este comando (substitui a chave):

**Windows (PowerShell):**
```powershell
docker run --rm -e SENTINEL_API_KEY="sk_live_TUA_CHAVE" -v "${PWD}:/app/target" sentinel-scanner python main.py /app/target
```

---

Linux / Mac / Git Bash:
```bash
docker run --rm -e SENTINEL_API_KEY="sk_live_TUA_CHAVE" -v "$(pwd):/app/target" sentinel-scanner python main.py /app/target
```

✅ Resultado: O scan corre localmente e o relatório é sincronizado automaticamente com o teu Dashboard!

---

### Integração CI/CD (GitHub Actions)
Para proteger um repositório GitHub automaticamente a cada Push:

No repositório de destino, cria o ficheiro .github/workflows/sentinel.yml.

Adiciona a tua SENTINEL_API_KEY nos Secrets do repositório.

Usa esta configuração:

```yaml
name: Sentinel Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Sentinel
        # Substitui 'O-TEU-USER' pelo teu username do GitHub
        uses: O-TEU-USER/Sentinel/backend@main
        with:
          target-dir: '.'
          output-file: 'security-report.json'
        env:
          SENTINEL_API_KEY: ${{ secrets.SENTINEL_API_KEY }}

```
---

### Estrutura do Projeto

```
Sentinel/
├── 📂 .github/             # Workflows para CI/CD (GitHub Actions)
├── 📂 backend/             # O "Cérebro" do sistema (Python/FastAPI)
│   ├── 📂 core/            # Lógica principal de segurança
│   │   ├── compliance.py   # Verificação GDPR/SOC2
│   │   ├── scanner.py      # Motor de análise de Regex
│   │   ├── tasks.py        # Tarefas assíncronas (Celery)
│   │   └── ai.py           # Integração com Gemini AI
│   ├── api.py              # Endpoints da API REST
│   ├── main.py             # Script de entrada para CLI
│   ├── rules.yaml          # Definições das vulnerabilidades
│   └── Dockerfile          # Configuração da imagem Backend
├── 📂 cli/                 # Ferramentas de linha de comandos
│   └── sentinel.py         # Script standalone para scans rápidos
├── 📂 frontend/            # O Dashboard (Next.js/React)
│   ├── 📂 app/             # Páginas (Login, Dashboard, Settings)
│   ├── 📂 lib/             # Cliente Supabase e utilitários
│   └── Dockerfile          # Configuração da imagem Frontend
├── 🐳 docker-compose.yml   # Orquestração de todos os serviços
└── 📄 .env.example         # Exemplo das variáveis de ambiente necessárias

```

---

### 👤 Autor

Desenvolvido com ❤️ e café por Miguel Ferreira

GitHub: @miguelaopt (ou o teu user correto)

Email: miguel.rf267@gmail.com
