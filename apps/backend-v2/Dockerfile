FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo_pgsql zip pcntl \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

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

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
