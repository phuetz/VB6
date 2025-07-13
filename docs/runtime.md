# VB6 Runtime

Ce document décrit brièvement les fonctions principales fournies par le runtime JavaScript.

## Création d'objets COM

La fonction `CreateObject` permet d'instancier un composant COM ou ActiveX lorsqu'il est disponible dans l'environnement. Elle tente d'abord d'utiliser `ActiveXObject` puis un constructeur global portant le même nom.

```
const runtime = createRuntimeFunctions(() => {}, console.error);
const fso = runtime.CreateObject('Scripting.FileSystemObject');
```

## Gestion simplifiée

`ReleaseObject` est présent pour compatibilité avec VB6 mais n'effectue aucune action dans cet environnement.

Pour plus d'informations sur les autres fonctions du runtime, consultez le code source dans `src/components/Runtime/VB6Runtime.tsx`.
