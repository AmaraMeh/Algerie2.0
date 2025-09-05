/**
 * Logique principale de l'extension Quick Reply Manager
 */

class QuickReplyApp {
    constructor() {
        this.currentCategoryId = null;
        this.currentReplyId = null;
        this.isSearchMode = false;
        this.searchResults = [];
        
        this.initializeApp();
    }

    /**
     * Initialise l'application
     */
    async initializeApp() {
        try {
            // Initialiser le stockage
            await storageManager.initialize();
            
            // Charger les données
            await this.loadCategories();
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Afficher la première catégorie si disponible
            const categories = await storageManager.getCategories();
            if (categories.length > 0) {
                this.switchToCategory(categories[0].id);
            } else {
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showToast('Erreur lors du chargement des données', 'error');
        }
    }

    /**
     * Configure tous les écouteurs d'événements
     */
    setupEventListeners() {
        // Recherche
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', this.handleSearch.bind(this));
        clearSearch.addEventListener('click', this.clearSearch.bind(this));
        
        // Boutons d'action
        document.getElementById('addCategoryBtn').addEventListener('click', this.showAddCategoryModal.bind(this));
        document.getElementById('addFirstReplyBtn').addEventListener('click', this.showAddReplyModal.bind(this));
        document.getElementById('settingsBtn').addEventListener('click', this.showSettingsModal.bind(this));
        
        // Modales - Catégorie
        document.getElementById('closeCategoryModal').addEventListener('click', this.hideCategoryModal.bind(this));
        document.getElementById('cancelCategoryBtn').addEventListener('click', this.hideCategoryModal.bind(this));
        document.getElementById('saveCategoryBtn').addEventListener('click', this.saveCategory.bind(this));
        
        // Modales - Réponse
        document.getElementById('closeReplyModal').addEventListener('click', this.hideReplyModal.bind(this));
        document.getElementById('cancelReplyBtn').addEventListener('click', this.hideReplyModal.bind(this));
        document.getElementById('saveReplyBtn').addEventListener('click', this.saveReply.bind(this));
        
        // Modales - Paramètres
        document.getElementById('closeSettingsModal').addEventListener('click', this.hideSettingsModal.bind(this));
        document.getElementById('exportDataBtn').addEventListener('click', this.exportData.bind(this));
        document.getElementById('importDataBtn').addEventListener('click', this.importData.bind(this));
        document.getElementById('importFileInput').addEventListener('change', this.handleImportFile.bind(this));
        document.getElementById('clearAllDataBtn').addEventListener('click', this.clearAllData.bind(this));
        
        // Actions sur les réponses
        document.getElementById('copyBtn').addEventListener('click', this.copyToClipboard.bind(this));
        document.getElementById('editReplyBtn').addEventListener('click', this.editCurrentReply.bind(this));
        document.getElementById('deleteReplyBtn').addEventListener('click', this.deleteCurrentReply.bind(this));
        
        // Fermer les modales en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Charge et affiche les catégories
     */
    async loadCategories() {
        try {
            const categories = await storageManager.getCategories();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
            this.showToast('Erreur lors du chargement des catégories', 'error');
        }
    }

    /**
     * Affiche les catégories sous forme d'onglets
     */
    renderCategories(categories) {
        const tabsContainer = document.getElementById('categoryTabs');
        tabsContainer.innerHTML = '';
        
        categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'tab';
            tab.textContent = category.name;
            tab.dataset.categoryId = category.id;
            
            // Actions sur l'onglet
            const actions = document.createElement('button');
            actions.className = 'tab-actions';
            actions.innerHTML = '×';
            actions.title = 'Supprimer la catégorie';
            actions.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(category.id);
            });
            
            tab.appendChild(actions);
            tab.addEventListener('click', () => this.switchToCategory(category.id));
            tabsContainer.appendChild(tab);
        });
    }

    /**
     * Bascule vers une catégorie
     */
    async switchToCategory(categoryId) {
        try {
            this.currentCategoryId = categoryId;
            this.currentReplyId = null;
            this.isSearchMode = false;
            
            // Mettre à jour l'onglet actif
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.categoryId === categoryId);
            });
            
            // Charger et afficher les réponses
            const replies = await storageManager.getReplies(categoryId);
            this.renderReplies(replies);
            
            // Masquer les détails et les résultats de recherche
            document.getElementById('replyDetail').style.display = 'none';
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('repliesContainer').style.display = 'block';
            
            // Afficher l'état vide si nécessaire
            if (replies.length === 0) {
                this.showEmptyState();
            } else {
                document.getElementById('emptyState').style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erreur lors du changement de catégorie:', error);
            this.showToast('Erreur lors du changement de catégorie', 'error');
        }
    }

    /**
     * Affiche les réponses d'une catégorie
     */
    renderReplies(replies) {
        const repliesList = document.getElementById('repliesList');
        repliesList.innerHTML = '';
        
        if (replies.length === 0) {
            this.showEmptyState();
            return;
        }
        
        replies.forEach(reply => {
            const replyItem = document.createElement('div');
            replyItem.className = 'reply-item';
            replyItem.dataset.replyId = reply.id;
            
            replyItem.innerHTML = `
                <div class="reply-item-title">${this.escapeHtml(reply.title)}</div>
                <div class="reply-item-preview">${this.escapeHtml(reply.text.substring(0, 100))}${reply.text.length > 100 ? '...' : ''}</div>
            `;
            
            replyItem.addEventListener('click', () => this.showReplyDetail(reply));
            repliesList.appendChild(replyItem);
        });
    }

    /**
     * Affiche les détails d'une réponse
     */
    showReplyDetail(reply) {
        this.currentReplyId = reply.id;
        
        document.getElementById('detailTitle').textContent = reply.title;
        document.getElementById('detailText').textContent = reply.text;
        
        document.getElementById('repliesContainer').style.display = 'none';
        document.getElementById('replyDetail').style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
    }

    /**
     * Gère la recherche
     */
    async handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            this.clearSearch();
            return;
        }
        
        if (query.length < 2) {
            return;
        }
        
        try {
            this.searchResults = await storageManager.searchReplies(query);
            this.renderSearchResults();
            this.isSearchMode = true;
            
            // Masquer les autres vues
            document.getElementById('repliesContainer').style.display = 'none';
            document.getElementById('replyDetail').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';
            
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            this.showToast('Erreur lors de la recherche', 'error');
        }
    }

    /**
     * Affiche les résultats de recherche
     */
    renderSearchResults() {
        const searchResults = document.getElementById('searchResults');
        const resultsList = document.getElementById('searchResultsList');
        const resultsCount = document.getElementById('resultsCount');
        
        resultsCount.textContent = `${this.searchResults.length} résultat${this.searchResults.length > 1 ? 's' : ''}`;
        resultsList.innerHTML = '';
        
        if (this.searchResults.length === 0) {
            resultsList.innerHTML = '<div class="empty-state"><p>Aucun résultat trouvé</p></div>';
        } else {
            this.searchResults.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                resultItem.innerHTML = `
                    <div class="search-result-category">${this.escapeHtml(result.categoryName)}</div>
                    <div class="search-result-title">${this.escapeHtml(result.title)}</div>
                    <div class="search-result-preview">${this.escapeHtml(result.text.substring(0, 100))}${result.text.length > 100 ? '...' : ''}</div>
                `;
                
                resultItem.addEventListener('click', () => {
                    this.switchToCategory(result.categoryId);
                    setTimeout(() => {
                        const replyElement = document.querySelector(`[data-reply-id="${result.id}"]`);
                        if (replyElement) {
                            replyElement.click();
                        }
                    }, 100);
                });
                
                resultsList.appendChild(resultItem);
            });
        }
        
        searchResults.style.display = 'block';
    }

    /**
     * Efface la recherche
     */
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.isSearchMode = false;
        this.searchResults = [];
        
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('repliesContainer').style.display = 'block';
        
        if (this.currentCategoryId) {
            this.switchToCategory(this.currentCategoryId);
        }
    }

    /**
     * Affiche l'état vide
     */
    showEmptyState() {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('repliesContainer').style.display = 'none';
        document.getElementById('replyDetail').style.display = 'none';
        document.getElementById('searchResults').style.display = 'none';
    }

    /**
     * Affiche la modale d'ajout de catégorie
     */
    showAddCategoryModal() {
        document.getElementById('categoryModalTitle').textContent = 'Nouvelle catégorie';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryModal').classList.add('show');
        document.getElementById('categoryName').focus();
    }

    /**
     * Masque la modale de catégorie
     */
    hideCategoryModal() {
        document.getElementById('categoryModal').classList.remove('show');
    }

    /**
     * Sauvegarde une catégorie
     */
    async saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        
        if (!name) {
            this.showToast('Le nom de la catégorie est requis', 'error');
            return;
        }
        
        try {
            await storageManager.addCategory(name);
            await this.loadCategories();
            this.hideCategoryModal();
            this.showToast('Catégorie créée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            this.showToast('Erreur lors de la création de la catégorie', 'error');
        }
    }

    /**
     * Supprime une catégorie
     */
    async deleteCategory(categoryId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Toutes les réponses qu\'elle contient seront également supprimées.')) {
            return;
        }
        
        try {
            await storageManager.deleteCategory(categoryId);
            await this.loadCategories();
            
            // Si c'était la catégorie active, basculer vers la première disponible
            if (this.currentCategoryId === categoryId) {
                const categories = await storageManager.getCategories();
                if (categories.length > 0) {
                    this.switchToCategory(categories[0].id);
                } else {
                    this.showEmptyState();
                }
            }
            
            this.showToast('Catégorie supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            this.showToast('Erreur lors de la suppression de la catégorie', 'error');
        }
    }

    /**
     * Affiche la modale d'ajout de réponse
     */
    showAddReplyModal() {
        if (!this.currentCategoryId) {
            this.showToast('Veuillez d\'abord sélectionner une catégorie', 'error');
            return;
        }
        
        document.getElementById('replyModalTitle').textContent = 'Nouvelle réponse';
        document.getElementById('replyTitle').value = '';
        document.getElementById('replyText').value = '';
        document.getElementById('replyModal').classList.add('show');
        document.getElementById('replyTitle').focus();
    }

    /**
     * Masque la modale de réponse
     */
    hideReplyModal() {
        document.getElementById('replyModal').classList.remove('show');
    }

    /**
     * Sauvegarde une réponse
     */
    async saveReply() {
        const title = document.getElementById('replyTitle').value.trim();
        const text = document.getElementById('replyText').value.trim();
        
        if (!title || !text) {
            this.showToast('Le titre et le texte sont requis', 'error');
            return;
        }
        
        try {
            await storageManager.addReply(this.currentCategoryId, title, text);
            await this.switchToCategory(this.currentCategoryId);
            this.hideReplyModal();
            this.showToast('Réponse créée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la création de la réponse:', error);
            this.showToast('Erreur lors de la création de la réponse', 'error');
        }
    }

    /**
     * Modifie la réponse actuelle
     */
    editCurrentReply() {
        if (!this.currentReplyId) return;
        
        // Récupérer les données actuelles
        const title = document.getElementById('detailTitle').textContent;
        const text = document.getElementById('detailText').textContent;
        
        document.getElementById('replyModalTitle').textContent = 'Modifier la réponse';
        document.getElementById('replyTitle').value = title;
        document.getElementById('replyText').value = text;
        document.getElementById('replyModal').classList.add('show');
        document.getElementById('replyTitle').focus();
    }

    /**
     * Supprime la réponse actuelle
     */
    async deleteCurrentReply() {
        if (!this.currentReplyId || !this.currentCategoryId) return;
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
            return;
        }
        
        try {
            await storageManager.deleteReply(this.currentCategoryId, this.currentReplyId);
            await this.switchToCategory(this.currentCategoryId);
            this.showToast('Réponse supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression de la réponse:', error);
            this.showToast('Erreur lors de la suppression de la réponse', 'error');
        }
    }

    /**
     * Copie le texte dans le presse-papier
     */
    async copyToClipboard() {
        const text = document.getElementById('detailText').textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Texte copié dans le presse-papier', 'success');
        } catch (error) {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Texte copié dans le presse-papier', 'success');
        }
    }

    /**
     * Affiche la modale des paramètres
     */
    showSettingsModal() {
        document.getElementById('settingsModal').classList.add('show');
    }

    /**
     * Masque la modale des paramètres
     */
    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    /**
     * Exporte les données
     */
    async exportData() {
        try {
            const data = await storageManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `quick-reply-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Données exportées avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showToast('Erreur lors de l\'export des données', 'error');
        }
    }

    /**
     * Importe les données
     */
    importData() {
        document.getElementById('importFileInput').click();
    }

    /**
     * Gère l'import de fichier
     */
    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await storageManager.importData(data);
            await this.loadCategories();
            
            // Basculer vers la première catégorie
            const categories = await storageManager.getCategories();
            if (categories.length > 0) {
                this.switchToCategory(categories[0].id);
            }
            
            this.showToast('Données importées avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            this.showToast('Erreur lors de l\'import des données', 'error');
        }
        
        // Réinitialiser l'input
        e.target.value = '';
    }

    /**
     * Efface toutes les données
     */
    async clearAllData() {
        if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) {
            return;
        }
        
        try {
            await storageManager.saveData({ categories: [] });
            await this.loadCategories();
            this.showEmptyState();
            this.showToast('Toutes les données ont été effacées', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'effacement:', error);
            this.showToast('Erreur lors de l\'effacement des données', 'error');
        }
    }

    /**
     * Masque toutes les modales
     */
    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    /**
     * Gère les raccourcis clavier
     */
    handleKeyboard(e) {
        // Échap pour fermer les modales
        if (e.key === 'Escape') {
            this.hideAllModals();
        }
        
        // Ctrl/Cmd + K pour la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl/Cmd + N pour nouvelle réponse
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.showAddReplyModal();
        }
    }

    /**
     * Affiche une notification toast
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Échappe le HTML pour éviter les injections
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new QuickReplyApp();
});