import os
from celery import Celery

# Configuração do Celery
broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "sentinel_worker",
    broker=broker_url,
    backend=result_backend,
    include=["core.tasks"] # Importante: Diz onde estão as tarefas
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)