FROM python:3.11-slim

RUN groupadd -r vicoo && useradd -r -g vicoo -d /app -s /sbin/nologin vicoo

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R vicoo:vicoo /app

EXPOSE 8000

USER vicoo

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
