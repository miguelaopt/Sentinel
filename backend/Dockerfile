# 1. Imagem base leve (Python)
FROM python:3.10-slim

# 2. Prevenir que o Python crie ficheiros .pyc e buffer de output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Definir pasta de trabalho dentro do container
WORKDIR /app

# 4. Copiar dependências e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar o código fonte e regras
COPY core/ ./core/
COPY main.py .
COPY rules.yaml .

# 6. Definir o ponto de entrada (O que corre quando o container inicia)
ENTRYPOINT ["python", "main.py"]