# 1. Imagem base
FROM python:3.10-slim

# 2. Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Pasta de trabalho
WORKDIR /app

# 4. Instalar dependências (incluindo as novas para Worker/Redis)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar código
COPY . .

# 6. Remover ENTRYPOINT fixo. 
# Usamos CMD como padrão para a API, mas pode ser sobrescrito pelo docker-compose.
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]