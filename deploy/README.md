# Deploy Commands

Уже есть:

- Docker установлен
- `docker-compose.prod.yaml` лежит в `/opt/event-planner`
- секреты в compose заменены

## 1. Установить Nginx и Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 2. UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 3. Подключить временный HTTP Nginx конфиг

```bash
sudo tee /etc/nginx/sites-available/event-planner > /dev/null <<'EOF'
server {
    listen 80;
    server_name planner.grekassoq.ru;

    location / {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/event-planner /etc/nginx/sites-enabled/event-planner
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Получить сертификат

```bash
sudo certbot certonly --nginx -d planner.grekassoq.ru
```

## 5. Подключить основной Nginx конфиг

```bash
sudo cp /opt/event-planner/deploy/nginx.conf /etc/nginx/sites-available/event-planner
sudo ln -sf /etc/nginx/sites-available/event-planner /etc/nginx/sites-enabled/event-planner
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Запустить приложение

```bash
cd /opt/event-planner
docker compose pull
COMPOSE_PROFILES=migrations docker compose run --rm backend-migrations
docker compose up -d
```

## 7. Проверить

```bash
docker compose ps
curl -I https://planner.grekassoq.ru
curl https://planner.grekassoq.ru/api/v1/health
```

## Сделать пользователя админом

Сначала пользователь должен зарегистрироваться в приложении.

```bash
cd /opt/event-planner
docker compose exec postgres \
  psql -U event_planner -d event_planner \
  -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

Проверить:

```bash
docker compose exec postgres \
  psql -U event_planner -d event_planner \
  -c "SELECT email, role, status FROM users WHERE email = 'user@example.com';"
```

## Обновление

```bash
cd /opt/event-planner
docker compose pull
COMPOSE_PROFILES=migrations docker compose run --rm backend-migrations
docker compose up -d
docker image prune -f
```
