FROM dunglas/frankenphp:1-php8.4-bookworm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN install-php-extensions \
    pcntl \
    pdo_pgsql \
    redis \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY . .
RUN cp .env.example .env \
    && sed -i 's/DB_HOST=.*/DB_HOST=postgres/' .env \
    && sed -i 's/DB_USERNAME=.*/DB_USERNAME=user/' .env \
    && sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=password/' .env \
    && sed -i 's/REDIS_HOST=.*/REDIS_HOST=redis/' .env \
    && sed -i 's/REDIS_PASSWORD=.*/REDIS_PASSWORD=/' .env \
    && sed -i 's/CACHE_STORE=.*/CACHE_STORE=redis/' .env \
    && echo 'JWT_SECRET=vstep-dev-jwt-secret-change-in-production' >> .env \
    && composer run-script post-autoload-dump \
    && php artisan storage:link 2>/dev/null || true

EXPOSE 8000
EXPOSE 2019

CMD ["php", "artisan", "octane:start", "--server=frankenphp", "--host=0.0.0.0", "--port=8000", "--admin-port=2019", "--workers=auto", "--max-requests=500"]
