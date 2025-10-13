FROM node:20-slim

WORKDIR /app

# Устанавливаем зависимости для компиляции better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем директорию для БД с правильными правами
RUN mkdir -p /app/data && chown -R node:node /app

# Переключаемся на пользователя node
USER node

# Запускаем бота
CMD ["npm", "start"]

