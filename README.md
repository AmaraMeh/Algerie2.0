# Quick Reply Manager

Une extension Chrome pour gérer des réponses rapides dans une popup Always-on-Top.

## 🚀 Fonctionnalités

- **Popup flottante** : Interface toujours accessible pendant la navigation
- **Système de catégories** : Organisez vos réponses par thème (ex: "Inscription", "Carte étudiant", "Transfert")
- **Modèles de réponses** : Créez des réponses avec titre et texte complet
- **Recherche rapide** : Trouvez instantanément vos réponses par mot-clé
- **Copie en un clic** : Copiez vos réponses dans le presse-papier
- **Interface moderne** : Design minimaliste et intuitif
- **Stockage local** : Vos données restent privées sur votre machine
- **Import/Export** : Sauvegardez et restaurez vos données

## 📦 Installation

### Méthode 1 : Installation en mode développeur

1. **Téléchargez ou clonez** ce projet sur votre machine
2. **Ouvrez Chrome** et allez dans `chrome://extensions/`
3. **Activez le mode développeur** (bouton en haut à droite)
4. **Cliquez sur "Charger l'extension non empaquetée"**
5. **Sélectionnez le dossier** contenant les fichiers de l'extension
6. **L'extension est maintenant installée** ! 🎉

### Méthode 2 : Installation depuis le Chrome Web Store

*Bientôt disponible...*

## 🎯 Utilisation

### Première utilisation

1. **Cliquez sur l'icône** de l'extension dans la barre d'outils Chrome
2. **Créez votre première catégorie** en cliquant sur le bouton "+" à côté des onglets
3. **Ajoutez des réponses** en cliquant sur "Ajouter une réponse"

### Gestion des catégories

- **Créer** : Cliquez sur le bouton "+" à côté des onglets
- **Supprimer** : Survolez un onglet et cliquez sur le "×"
- **Basculer** : Cliquez sur l'onglet de votre choix

### Gestion des réponses

- **Ajouter** : Cliquez sur "Ajouter une réponse" ou utilisez `Ctrl+N`
- **Modifier** : Cliquez sur une réponse, puis sur l'icône d'édition
- **Supprimer** : Cliquez sur une réponse, puis sur l'icône de suppression
- **Copier** : Cliquez sur une réponse, puis sur "Copier"

### Recherche

- **Recherche rapide** : Tapez dans la barre de recherche (minimum 2 caractères)
- **Raccourci** : `Ctrl+K` pour accéder rapidement à la recherche
- **Effacer** : Cliquez sur le "×" dans la barre de recherche

### Paramètres

- **Export** : Sauvegardez vos données en JSON
- **Import** : Restaurez vos données depuis un fichier JSON
- **Effacer tout** : Supprime toutes les données (irréversible)

## ⌨️ Raccourcis clavier

- `Ctrl+K` : Focus sur la barre de recherche
- `Ctrl+N` : Nouvelle réponse
- `Échap` : Fermer les modales

## 🏗️ Structure du projet

```
quick-reply-manager/
├── manifest.json          # Configuration de l'extension (Manifest V3)
├── popup.html             # Interface utilisateur principale
├── popup.js               # Logique de l'interface
├── storage.js             # Gestionnaire de stockage des données
├── background.js          # Service worker pour la persistance
├── style.css              # Styles CSS modernes
└── README.md              # Documentation
```

## 🔧 Technologies utilisées

- **Manifest V3** : Dernière version des extensions Chrome
- **Chrome Storage API** : Stockage local sécurisé
- **Vanilla JavaScript** : Pas de dépendances externes
- **CSS moderne** : Flexbox, Grid, animations
- **HTML5** : Structure sémantique

## 📱 Compatibilité

- **Chrome** : Version 88+
- **Edge** : Version 88+ (basé sur Chromium)
- **Brave** : Version 88+
- **Autres navigateurs Chromium** : Version 88+

## 🔒 Confidentialité

- **Aucune donnée envoyée** vers des serveurs externes
- **Stockage local uniquement** : Vos données restent sur votre machine
- **Aucun tracking** : L'extension ne collecte aucune information personnelle
- **Code open source** : Vous pouvez vérifier le code source

## 🐛 Dépannage

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Assurez-vous que tous les fichiers sont présents
- Rechargez l'extension dans `chrome://extensions/`

### Les données ne se sauvegardent pas
- Vérifiez les permissions de l'extension
- Redémarrez Chrome
- Vérifiez l'espace de stockage disponible

### La copie ne fonctionne pas
- Assurez-vous que Chrome a les permissions nécessaires
- Testez sur un site web simple
- Vérifiez que le texte n'est pas vide

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. **Signaler des bugs** via les issues
2. **Proposer des améliorations** via les issues
3. **Soumettre des pull requests**
4. **Améliorer la documentation**

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆕 Changelog

### Version 1.0.0
- ✅ Interface utilisateur moderne
- ✅ Système de catégories
- ✅ Gestion des réponses rapides
- ✅ Recherche en temps réel
- ✅ Copie dans le presse-papier
- ✅ Import/Export des données
- ✅ Raccourcis clavier
- ✅ Stockage local sécurisé

## 📞 Support

Si vous rencontrez des problèmes ou avez des questions :

1. **Vérifiez cette documentation**
2. **Consultez les issues** sur GitHub
3. **Créez une nouvelle issue** si nécessaire

---

**Développé avec ❤️ pour améliorer votre productivité**