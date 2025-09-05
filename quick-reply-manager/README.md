# Quick Reply Manager v2.0

Une extension Chrome améliorée pour gérer des réponses rapides avec synchronisation Firebase et authentification Google.

## 🚀 Nouvelles fonctionnalités

### ✨ Interface utilisateur améliorée
- **Popup redimensionnable** : Glissez-déposez et redimensionnez la popup selon vos besoins
- **Design moderne** : Interface sombre avec animations fluides et effets de survol
- **Meilleure ergonomie** : Boutons avec feedback visuel et transitions smooth

### 🔐 Authentification Google
- **Connexion sécurisée** : Authentification via Google OAuth
- **Synchronisation automatique** : Vos données sont sauvegardées dans Firebase
- **Accès multi-appareils** : Accédez à vos modèles depuis n'importe quel appareil

### 📋 Fonctionnalités de copie/collage améliorées
- **Copie fiable** : Bouton copier avec fallback pour tous les navigateurs
- **Collage direct** : Bouton "Coller dans la conversation" pour insérer directement dans les champs de texte
- **Feedback visuel** : Confirmation visuelle des actions réussies

### 🌐 Modèles partagés
- **Partage de modèles** : Partagez vos meilleurs modèles avec la communauté
- **Importation facile** : Importez des modèles partagés par d'autres utilisateurs
- **Bibliothèque communautaire** : Découvrez de nouveaux modèles utiles

### 💾 Stockage hybride
- **Synchronisation intelligente** : Fonctionne en ligne et hors ligne
- **Sauvegarde locale** : Vos données sont toujours disponibles même sans connexion
- **Synchronisation automatique** : Mise à jour automatique quand vous êtes connecté

## 🛠️ Installation

1. Clonez ou téléchargez ce dossier
2. Ouvrez Chrome et allez dans `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier `quick-reply-manager`

## 🎯 Utilisation

### Première utilisation
1. Cliquez sur l'icône de l'extension ou utilisez `Alt+Q`
2. Connectez-vous avec votre compte Google
3. Créez vos premières catégories et modèles

### Gestion des modèles
- **Créer** : Cliquez sur "Nouveau modèle"
- **Éditer** : Sélectionnez un modèle et cliquez sur "Éditer"
- **Copier** : Cliquez sur "Copier" pour copier dans le presse-papiers
- **Coller** : Cliquez sur "Coller dans la conversation" pour insérer directement
- **Partager** : Cliquez sur "Partager" pour partager avec la communauté

### Modèles partagés
- Cliquez sur "Modèles partagés" pour voir la bibliothèque communautaire
- Importez des modèles intéressants dans vos catégories
- Partagez vos propres créations

## 🔧 Configuration Firebase

L'extension utilise Firebase pour la synchronisation. La configuration est déjà incluse, mais vous pouvez la personnaliser dans `firebase.js` si nécessaire.

## 📱 Compatibilité

- Chrome 88+
- Manifest V3
- Fonctionne sur tous les sites web
- Support des champs de texte, textarea et contentEditable

## 🎨 Personnalisation

L'interface utilise des variables CSS personnalisables dans `style.css` :
- Couleurs du thème
- Animations et transitions
- Tailles et espacements

## 🐛 Dépannage

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Rechargez l'extension dans `chrome://extensions/`

### Problèmes de synchronisation
- Vérifiez votre connexion internet
- Reconnectez-vous avec Google si nécessaire

### Le bouton coller ne fonctionne pas
- Assurez-vous qu'un champ de texte est actif
- Essayez de cliquer dans le champ avant d'utiliser le bouton

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer le code
- Partager des modèles utiles

---

**Version 2.0** - Révolutionnez votre productivité avec Quick Reply Manager ! ⚡