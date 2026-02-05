# 1. Imagem base
FROM python:3.10-slim

# 2. Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Pasta de trabalho interna (onde vamos guardar o código)
WORKDIR /app

# 4. Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar TODO o código da pasta backend para dentro da pasta /app do container
COPY . .

# 6. O FIX ESTÁ AQUI: Usar o caminho absoluto /app/main.py
# Assim, não importa em que pasta o GitHub decide arrancar, ele vai sempre ao sítio certo.
ENTRYPOINT ["python", "/app/main.py"]