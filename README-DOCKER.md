# 🐳 Guide Docker pour VB6 Web IDE

## 📋 Vue d'ensemble

Ce guide explique comment utiliser Docker et Docker Compose pour déployer VB6 Web IDE dans différents environnements.

## 🚀 Démarrage Rapide

### 1. Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB espace disque

### 2. Installation Simple

```bash
# Cloner le projet
git clone https://github.com/your-org/vb6-web-ide.git
cd vb6-web-ide

# Copier la configuration
cp .env.example .env

# Démarrer l'application
chmod +x scripts/docker-start.sh
./scripts/docker-start.sh
```

L'application sera accessible sur:

- 🌐 http://localhost:8080
- 🔒 https://localhost:8443

## 📦 Configurations Disponibles

### 1. **Production** (`docker-compose.yml`)

Configuration complète avec tous les services:

- ✅ Application VB6 IDE
- ✅ Nginx avec SSL
- ✅ Monitoring (Prometheus + Grafana)
- ✅ Backup automatique
- ✅ Optimisations de performance

```bash
# Démarrer en production
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### 2. **Production Haute Disponibilité** (`docker-compose.prod.yml`)

Configuration pour déploiement à grande échelle:

- ✅ Load balancing avec HAProxy
- ✅ Multiple replicas
- ✅ Cache Redis
- ✅ Logs centralisés (Loki)
- ✅ Métriques avancées

```bash
# Démarrer en mode HA
docker-compose -f docker-compose.prod.yml up -d

# Scaler l'application
docker-compose -f docker-compose.prod.yml up -d --scale vb6-ide=3
```

### 3. **Développement** (`docker-compose.dev.yml`)

Configuration pour développeurs:

- ✅ Hot-reload activé
- ✅ Debugging Node.js
- ✅ PostgreSQL + Adminer
- ✅ Mailhog pour tester les emails
- ✅ Volumes pour le code source

```bash
# Démarrer en développement
docker-compose -f docker-compose.dev.yml up

# Accès aux services de dev
# - Application: http://localhost:5173
# - Adminer: http://localhost:8090
# - Mailhog: http://localhost:8025
```

## 🛠️ Configuration

### Variables d'Environnement

Éditer le fichier `.env`:

```env
# Ports
HTTP_PORT=8080
HTTPS_PORT=8443

# Sécurité
CSP_NONCE=your-random-nonce
GRAFANA_PASSWORD=secure-password

# Performance
MAX_WORKERS=4
MEMORY_LIMIT=2048

# Features
ENABLE_MONITORING=true
ENABLE_BACKUP=true
```

### SSL/TLS

Pour utiliser vos propres certificats:

```bash
# Copier vos certificats
cp /path/to/cert.pem config/ssl/cert.pem
cp /path/to/key.pem config/ssl/key.pem

# Redémarrer nginx
docker-compose restart nginx-proxy
```

## 📊 Monitoring

### Accès aux Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
  - User: admin
  - Pass: (voir .env)

### Métriques Disponibles

- Performance de l'application
- Utilisation CPU/Mémoire
- Temps de réponse
- Nombre de requêtes
- Erreurs et logs

## 💾 Backup et Restauration

### Backup Automatique

Les backups sont effectués automatiquement chaque nuit à 2h:

```bash
# Backup manuel
docker-compose exec backup /backup.sh

# Voir les backups
ls -la ./backups/
```

### Restauration

```bash
# Arrêter l'application
docker-compose down

# Restaurer depuis un backup
tar -xzf ./backups/vb6-backup-2024-01-01.tar.gz -C /

# Redémarrer
docker-compose up -d
```

## 🔧 Commandes Utiles

### Gestion des Conteneurs

```bash
# Voir l'état des services
docker-compose ps

# Logs d'un service spécifique
docker-compose logs -f vb6-ide

# Redémarrer un service
docker-compose restart vb6-ide

# Mise à jour des images
docker-compose pull
docker-compose up -d
```

### Maintenance

```bash
# Nettoyer les resources Docker
docker system prune -a

# Vérifier l'utilisation disque
docker system df

# Inspecter un conteneur
docker inspect vb6-web-ide

# Exécuter une commande dans un conteneur
docker-compose exec vb6-ide sh
```

### Performance

```bash
# Statistiques en temps réel
docker stats

# Limiter les resources
docker update --memory="1g" --cpus="2" vb6-web-ide
```

## 🚨 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs vb6-ide

# Vérifier les ports
netstat -tulpn | grep -E '8080|8443'

# Reconstruire l'image
docker-compose build --no-cache
```

### Problèmes de performance

```bash
# Augmenter les limites
docker-compose -f docker-compose.yml up -d \
  --scale vb6-ide=2

# Vérifier l'utilisation mémoire
docker exec vb6-web-ide cat /proc/meminfo
```

### Erreurs SSL

```bash
# Regénérer les certificats
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/ssl/key.pem \
  -out config/ssl/cert.pem

# Redémarrer nginx
docker-compose restart nginx-proxy
```

## 🏭 Déploiement en Production

### 1. Préparation

```bash
# Construire l'image de production
docker build -f Dockerfile.prod -t vb6-ide:prod .

# Tagger pour registry
docker tag vb6-ide:prod registry.company.com/vb6-ide:latest

# Pousser vers registry
docker push registry.company.com/vb6-ide:latest
```

### 2. Docker Swarm

```bash
# Initialiser Swarm
docker swarm init

# Déployer le stack
docker stack deploy -c docker-compose.prod.yml vb6-stack

# Voir les services
docker service ls

# Scaler
docker service scale vb6-stack_vb6-ide=5
```

### 3. Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vb6-ide
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vb6-ide
  template:
    metadata:
      labels:
        app: vb6-ide
    spec:
      containers:
        - name: vb6-ide
          image: registry.company.com/vb6-ide:latest
          ports:
            - containerPort: 80
          resources:
            limits:
              memory: '2Gi'
              cpu: '2'
            requests:
              memory: '1Gi'
              cpu: '1'
```

## 📈 Optimisations

### 1. Build Multi-Stage

Notre Dockerfile utilise un build multi-stage pour réduire la taille:

- Stage 1: Dépendances (200MB)
- Stage 2: Build (500MB)
- Stage 3: Runtime (50MB)

### 2. Cache Docker

```bash
# Activer BuildKit pour un meilleur cache
export DOCKER_BUILDKIT=1

# Build avec cache
docker build --build-arg BUILDKIT_INLINE_CACHE=1 .
```

### 3. Compression

Les assets sont automatiquement compressés:

- Gzip pour HTML/CSS/JS
- Brotli pour les navigateurs modernes
- Images optimisées

## 🔐 Sécurité

### Bonnes Pratiques

1. **Utilisateur non-root**: Les conteneurs s'exécutent avec un utilisateur dédié
2. **Secrets**: Utiliser Docker secrets pour les données sensibles
3. **Réseau isolé**: Chaque stack a son propre réseau
4. **SSL/TLS**: HTTPS activé par défaut
5. **Headers de sécurité**: CSP, HSTS, etc.

### Scan de Sécurité

```bash
# Scanner l'image
docker scan vb6-ide:latest

# Vérifier les vulnérabilités
trivy image vb6-ide:latest
```

## 📞 Support

Pour toute question ou problème:

- 📚 [Documentation](./docs/)
- 🐛 [Issues GitHub](https://github.com/your-org/vb6-web-ide/issues)
- 💬 [Discussions](https://github.com/your-org/vb6-web-ide/discussions)

---

**VB6 Web IDE - Développement moderne avec Docker 🐳**
