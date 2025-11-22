#!/bin/bash

# Script d'arrêt Docker pour VB6 Web IDE
set -e

echo "🛑 Arrêt de VB6 Web IDE..."

# Sauvegarder avant l'arrêt
read -p "Voulez-vous effectuer une sauvegarde avant l'arrêt ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "💾 Sauvegarde en cours..."
    docker-compose exec backup /backup.sh
fi

# Arrêter les services
echo "⏹️  Arrêt des services..."
docker-compose down

# Demander si on veut supprimer les volumes
read -p "Voulez-vous supprimer les volumes de données ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Suppression des volumes..."
    docker-compose down -v
fi

echo "✅ VB6 Web IDE a été arrêté avec succès."