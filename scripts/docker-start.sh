#!/bin/bash

# Script de démarrage Docker pour VB6 Web IDE
set -e

echo "🚀 Démarrage de VB6 Web IDE avec Docker Compose..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env depuis .env.example..."
    cp .env.example .env
    echo "⚠️  Veuillez éditer le fichier .env avec vos paramètres personnalisés."
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p config/ssl config/grafana/dashboards config/grafana/datasources backups

# Créer un certificat SSL auto-signé si nécessaire
if [ ! -f config/ssl/cert.pem ]; then
    echo "🔒 Génération d'un certificat SSL auto-signé..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout config/ssl/key.pem \
        -out config/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Construire les images
echo "🏗️  Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🎯 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des services
echo "✅ Vérification de l'état des services..."
docker-compose ps

# Afficher les URLs d'accès
echo ""
echo "🎉 VB6 Web IDE est maintenant accessible !"
echo ""
echo "📍 URLs d'accès:"
echo "   - Application: http://localhost:8080"
echo "   - HTTPS: https://localhost:8443"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3000 (admin/admin)"
echo ""
echo "📊 Commandes utiles:"
echo "   - Voir les logs: docker-compose logs -f"
echo "   - Arrêter: docker-compose down"
echo "   - Redémarrer: docker-compose restart"
echo "   - Backup: docker-compose exec backup /backup.sh"
echo ""

# Afficher les logs en temps réel (optionnel)
read -p "Voulez-vous voir les logs en temps réel ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi