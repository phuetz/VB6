# 🚀 Quick Start Guide - VB6 Studio Revolutionary Features

## 1. Installation rapide

```bash
# Cloner le projet
git clone <your-repo-url>
cd vb6

# Installer les dépendances
npm install
cd server && npm install && cd ..
```

## 2. Démarrage

### Option 1: Tout démarrer en une commande
```bash
# Terminal 1: Application principale
npm run dev

# Terminal 2: Tous les serveurs backend
cd server && npm run dev:all
```

### Option 2: Démarrer individuellement
```bash
# Application principale
npm run dev

# Serveur de base de données (port 3001)
cd server && npm run dev

# Serveur de collaboration (port 3002)
cd server && npx ts-node src/collaboration/collaboration.server.ts

# Serveur AI (port 3003)
cd server && npx ts-node src/ai/ai.server.ts
```

## 3. Première utilisation

### 🤖 Assistant IA
1. Cliquez sur le bouton robot (🤖) en bas à droite
2. Tapez votre demande en langage naturel
3. Appliquez les suggestions de code en un clic

**Exemples:**
- "Crée un formulaire de connexion"
- "Ajoute une connexion à la base de données"
- "Optimise ce code"

### 👥 Collaboration
1. Cliquez sur le bouton de collaboration en haut à droite
2. Créez une nouvelle session ou rejoignez-en une existante
3. Partagez l'ID de session avec votre équipe
4. Codez ensemble en temps réel!

### 🐞 Débogueur Time-Travel
1. Cliquez sur le bouton insecte (🐞) en bas à gauche
2. Lancez le débogage pour commencer l'enregistrement
3. Naviguez dans l'historique d'exécution
4. Inspectez les variables à n'importe quel moment

### 🔄 Convertisseur de Code
1. Cliquez sur "Convert Code" en haut à droite
2. Sélectionnez le langage cible
3. Configurez les options de conversion
4. Convertissez et téléchargez le résultat

### 🛒 Marketplace
1. Cliquez sur le bouton panier (🛒)
2. Parcourez les plugins et templates
3. Installez en un clic (gratuit) ou ajoutez au panier (payant)
4. Gérez vos installations depuis le menu

## 4. Configuration avancée

### Variables d'environnement
Créez un fichier `.env` dans le dossier `server`:

```env
# Ports des serveurs
PORT=3001
COLLAB_PORT=3002
AI_PORT=3003

# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vb6studio

# AI (optionnel)
OPENAI_API_KEY=sk-...

# Client URL pour CORS
CLIENT_URL=http://localhost:5173
```

### Configuration du client
Dans le dossier racine, créez `.env`:

```env
# URL des serveurs
VITE_API_URL=http://localhost:3001
VITE_COLLAB_URL=http://localhost:3002
VITE_AI_URL=http://localhost:3003
```

## 5. Raccourcis clavier

- **Ctrl+Shift+P**: Palette de commandes
- **Ctrl+Space**: Autocomplétion IA
- **F5**: Démarrer le débogage
- **F10**: Step over (débogage)
- **Ctrl+Z/Y**: Undo/Redo avec time travel
- **Ctrl+K Ctrl+C**: Commenter la sélection
- **Ctrl+Shift+F**: Formater le code

## 6. Dépannage

### Les serveurs ne démarrent pas
```bash
# Vérifier les ports utilisés
lsof -i :3001
lsof -i :3002
lsof -i :3003

# Tuer les processus si nécessaire
kill -9 <PID>
```

### Erreur de connexion WebSocket
- Vérifiez que le serveur de collaboration est démarré
- Vérifiez les paramètres CORS dans le fichier .env
- Désactivez temporairement le firewall

### L'IA ne répond pas
- Vérifiez votre clé API OpenAI (optionnel)
- Le système fonctionne aussi sans OpenAI avec des patterns prédéfinis

## 7. Tips & Tricks

### 💡 Productivité maximale
1. Utilisez l'IA pour générer le code de base
2. Activez la collaboration pour le pair programming
3. Utilisez le time-travel debugger pour comprendre les bugs complexes
4. Explorez le marketplace pour des composants prêts à l'emploi

### 🎨 Personnalisation
1. Installez des thèmes depuis le marketplace
2. Créez vos propres snippets
3. Développez des plugins personnalisés
4. Partagez vos créations avec la communauté

## 8. Support

- **Documentation**: [REVOLUTIONARY_FEATURES.md](./REVOLUTIONARY_FEATURES.md)
- **Issues**: Créez une issue sur GitHub
- **Community**: Rejoignez notre Discord
- **Email**: support@vb6studio.com

## 9. Prochaines étapes

1. ✅ Explorez chaque fonctionnalité
2. ✅ Créez votre premier projet collaboratif
3. ✅ Installez des plugins utiles
4. ✅ Partagez vos retours!

Bon développement avec VB6 Studio! 🚀