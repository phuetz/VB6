# Build stage
FROM node:18-alpine AS builder

# Arguments de build
ARG NODE_VERSION=18
ARG BUILD_ENV=production

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Stage de production
FROM nginx:alpine

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Copier la configuration nginx personnalisée
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer les répertoires nécessaires
RUN mkdir -p /var/log/nginx /var/cache/nginx /app/data/projects /app/data/temp /app/data/cache /app/logs

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/html /var/log/nginx /var/cache/nginx /app

# Exposer les ports
EXPOSE 80 443

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]