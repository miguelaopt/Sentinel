# SentinelScan 🛡️

O SentinelScan é uma ferramenta de Análise Estática de Segurança (SAST) desenhada para Micro-SaaS.
Deteta segredos expostos (AWS, Stripe, Chaves Privadas) e más práticas de segurança antes do deploy.

## 🚀 Funcionalidades
- Deteção de Chaves de API (Regex Patterns)
- Relatórios em JSON (Para integração com Dashboards)
- Suporte Docker
- CI/CD Ready (Exit codes)

## 🛠️ Instalação e Uso

### Local (Python)
```bash
pip install -r requirements.txt
python main.py ./meu-projeto --output relatorio.json