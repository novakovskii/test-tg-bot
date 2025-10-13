FROM alpine:3.20

RUN apk add --no-cache bash sqlite tzdata

# Копируем скрипт
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Формат: минута час день месяц день_недели
RUN echo "0 0,12 * * * /usr/local/bin/backup.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

CMD ["crond", "-f", "-d", "8"]
