# 1. Imagem base
FROM python:3.10-slim

# 2. Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Pasta de trabalho
WORKDIR /app

# 4. Instalar dependências (como root, para instalar no sistema)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- FIX DE SEGURANÇA (CIS Benchmark 4.1) ---
# Criar um utilizador não-root chamado 'appuser'
RUN useradd -m -u 1000 appuser

# 5. Copiar código
COPY . .

# Mudar a posse dos ficheiros para o novo utilizador
RUN chown -R appuser:appuser /app

# Mudar o contexto para o utilizador seguro
USER appuser
# --------------------------------------------

# 6. Comando de arranque
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]