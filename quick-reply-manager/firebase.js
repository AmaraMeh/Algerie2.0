// Firebase configuration and services for Quick Reply Manager
// Using CDN imports for Chrome extension compatibility

// Firebase will be loaded via CDN in the HTML

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtscANFcA8pwPFCMtpLsqUIuQDG93VPL0",
  authDomain: "amara-8a16f.firebaseapp.com",
  projectId: "amara-8a16f",
  storageBucket: "amara-8a16f.firebasestorage.app",
  messagingSenderId: "114944150031",
  appId: "1:114944150031:web:97ae0c7258f9eb3aa1b17a"
};

// Initialize Firebase (will be available globally after CDN load)
let app, auth, db, provider;

function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    provider = new firebase.auth.GoogleAuthProvider();
    return true;
  }
  return false;
}

class FirebaseService {
  constructor() {
    this.user = null;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    return new Promise((resolve) => {
      if (!initializeFirebase()) {
        this.isInitialized = true;
        resolve(null);
        return;
      }
      
      auth.onAuthStateChanged((user) => {
        this.user = user;
        this.isInitialized = true;
        resolve(user);
      });
    });
  }

  async signInWithGoogle() {
    try {
      if (!auth) throw new Error('Firebase not initialized');
      const result = await auth.signInWithPopup(provider);
      this.user = result.user;
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      if (!auth) throw new Error('Firebase not initialized');
      await auth.signOut();
      this.user = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  async saveUserData(data) {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    try {
      if (!db) throw new Error('Firebase not initialized');
      const userDocRef = db.collection('users').doc(this.user.uid);
      await userDocRef.set({
        ...data,
        lastUpdated: new Date().toISOString(),
        userId: this.user.uid,
        userEmail: this.user.email
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  async getUserData() {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    try {
      if (!db) throw new Error('Firebase not initialized');
      const userDocRef = db.collection('users').doc(this.user.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        return userDoc.data();
      } else {
        // Return default data structure
        return {
          categories: [
            {
              id: crypto.randomUUID(),
              name: "Exemples",
              templates: [
                { id: crypto.randomUUID(), title: "Bienvenue", text: "Bonjour, comment puis-je vous aider ?" },
                { id: crypto.randomUUID(), title: "Infos Carte Étudiant", text: "Merci de fournir votre numéro d'étudiant et une pièce d'identité." }
              ]
            }
          ]
        };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async syncData(localData) {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Save local data to Firebase
      await this.saveUserData(localData);
      
      // Get the latest data from Firebase (in case of conflicts)
      const firebaseData = await this.getUserData();
      
      return firebaseData;
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  async getSharedTemplates() {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const templatesRef = db.collection('sharedTemplates');
      const querySnapshot = await templatesRef.orderBy('createdAt', 'desc').get();
      
      const sharedTemplates = [];
      querySnapshot.forEach((doc) => {
        sharedTemplates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return sharedTemplates;
    } catch (error) {
      console.error('Error getting shared templates:', error);
      throw error;
    }
  }

  async shareTemplate(template, categoryName) {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    try {
      if (!db) throw new Error('Firebase not initialized');
      const sharedTemplateRef = db.collection('sharedTemplates').doc();
      await sharedTemplateRef.set({
        ...template,
        categoryName,
        sharedBy: this.user.uid,
        sharedByEmail: this.user.email,
        createdAt: new Date().toISOString(),
        isPublic: true
      });
      
      return sharedTemplateRef.id;
    } catch (error) {
      console.error('Error sharing template:', error);
      throw error;
    }
  }
}

// Create and export the Firebase service instance
const firebaseService = new FirebaseService();

// Export for use in other files
window.FirebaseService = firebaseService;