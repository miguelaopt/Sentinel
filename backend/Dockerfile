# 1. Imagem base
FROM python:3.10-slim

# 2. Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Pasta de trabalho DENTRO do container
WORKDIR /app

# 4. Copiar e instalar dependências PRIMEIRO (para cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar o resto do código da pasta backend
COPY . .

# 6. Comando de arranque
ENTRYPOINT ["python", "/app/main.py"]