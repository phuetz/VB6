# Guide de Configuration Claude Code

Ce guide explique comment configurer Claude Code pour un fonctionnement optimal sur vos projets.

## Structure des fichiers de configuration

Claude Code utilise une hiérarchie de fichiers de configuration :

```
~/.claude.json                    # Configuration globale utilisateur
<projet>/.claude/settings.json    # Configuration partagée (commitée)
<projet>/.claude/settings.local.json  # Configuration locale (non commitée)
```

## Configuration recommandée pour un projet

### 1. Créer le répertoire de configuration

```bash
mkdir -p .claude
```

### 2. Créer le fichier de configuration locale

Créez `.claude/settings.local.json` avec le contenu suivant :

```json
{
  "permissions": {
    "allowedTools": [
      "Bash",
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Glob",
      "Grep",
      "LS",
      "Task",
      "TodoWrite",
      "WebFetch",
      "WebSearch",
      "NotebookRead",
      "NotebookEdit"
    ]
  },
  "hooks": {
    "PostToolUse": ["echo 'Tool execution completed'"]
  }
}
```

### 3. Protéger la configuration locale

Ajoutez à votre `.gitignore` :

```gitignore
# Claude Code local settings
.claude/settings.local.json
```

### 4. (Optionnel) Configuration partagée d'équipe

Pour partager des règles communes avec l'équipe, créez `.claude/settings.json` :

```json
{
  "permissions": {
    "ignorePatterns": ["node_modules/**", "dist/**", "build/**", ".env*"]
  }
}
```

## Outils disponibles

### Outils essentiels

- **Bash** : Exécution de commandes shell
- **Read** : Lecture de fichiers
- **Write** : Écriture de nouveaux fichiers
- **Edit** : Modification de fichiers existants
- **MultiEdit** : Modifications multiples dans un fichier

### Outils de recherche

- **Glob** : Recherche de fichiers par motifs
- **Grep** : Recherche dans le contenu des fichiers
- **LS** : Listage de répertoires

### Outils avancés

- **Task** : Délégation de tâches à des agents
- **TodoWrite** : Gestion de listes de tâches
- **WebFetch** : Récupération de contenu web
- **WebSearch** : Recherche web
- **NotebookRead/Edit** : Gestion des notebooks Jupyter

## Hooks disponibles

### Hooks de cycle de vie

- **PreToolUse** : Avant l'exécution d'un outil
- **PostToolUse** : Après l'exécution d'un outil
- **PreCompact** : Avant la compaction de conversation
- **Stop** : À l'arrêt de Claude Code
- **SubagentStop** : À l'arrêt d'un agent

### Exemple de hooks utiles

```json
{
  "hooks": {
    "PostToolUse": ["echo 'Action: $TOOL_NAME completed'", "date >> .claude/activity.log"],
    "PreCompact": [
      "echo 'Compacting conversation...'",
      "cp .claude/current_session.json .claude/backup_session.json"
    ]
  }
}
```

## Variables d'environnement

Vous pouvez définir des variables d'environnement dans la configuration :

```json
{
  "env": {
    "CUSTOM_VAR": "valeur",
    "DEBUG": "true"
  }
}
```

## Bonnes pratiques

### Sécurité

- ✅ Utilisez `settings.local.json` pour les configurations sensibles
- ✅ Ajoutez `settings.local.json` au `.gitignore`
- ✅ Partagez `settings.json` pour les règles communes d'équipe
- ❌ Ne committez jamais de tokens ou clés API

### Performance

- ✅ Configurez `ignorePatterns` pour exclure les gros répertoires
- ✅ Limitez les outils aux besoins réels du projet
- ✅ Utilisez des hooks pour automatiser les tâches répétitives

### Maintenance

- ✅ Documentez les configurations spécifiques dans le README
- ✅ Testez la configuration après chaque mise à jour
- ✅ Gardez une sauvegarde des configurations qui fonctionnent

## Dépannage

### Erreurs de configuration courantes

1. **Propriétés invalides** : Vérifiez que toutes les propriétés existent
2. **JSON malformé** : Validez avec `python3 -m json.tool settings.local.json`
3. **Permissions insuffisantes** : Vérifiez que les outils nécessaires sont dans `allowedTools`

### Commandes de diagnostic

```bash
# Valider la syntaxe JSON
python3 -m json.tool .claude/settings.local.json

# Voir la configuration active
claude /config

# Réinitialiser la configuration
rm .claude/settings.local.json
```

## Exemple complet pour un projet web

```json
{
  "permissions": {
    "allowedTools": [
      "Bash",
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Glob",
      "Grep",
      "LS",
      "Task",
      "TodoWrite",
      "WebFetch"
    ],
    "ignorePatterns": ["node_modules/**", "dist/**", "build/**", "coverage/**", ".env*", "*.log"]
  },
  "hooks": {
    "PostToolUse": ["echo 'Tool $TOOL_NAME executed successfully'"],
    "PreCompact": ["echo 'Saving session state...'", "date >> .claude/session.log"]
  }
}
```

## Conclusion

Cette configuration vous permettra d'utiliser Claude Code de façon optimale sur vos projets, avec :

- Tous les outils nécessaires autorisés
- Configuration persistante et non écrasée par les mises à jour
- Sécurité préservée avec les fichiers locaux
- Automatisation via les hooks

Adaptez cette configuration selon vos besoins spécifiques !
