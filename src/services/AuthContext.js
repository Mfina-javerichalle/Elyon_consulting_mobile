// ============================================================
// src/services/AuthContext.js
//
// Ce fichier crée un "contexte" React.
// Un contexte, c'est une boîte partagée par TOUTE l'application.
// Ici, cette boîte contient :
//   - les infos de l'utilisateur connecté (nom, email, rôle...)
//   - le token JWT
//   - les fonctions login / logout
//
// N'importe quel écran peut y accéder avec : useAuth()
// Sans contexte, il faudrait passer ces infos de composant
// en composant manuellement — ce serait très fastidieux.
// ============================================================

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';
import { login as apiLogin, logout as apiLogout } from './api';

// Création du contexte
// null = valeur par défaut si utilisé hors du Provider
const AuthContext = createContext(null);

// ============================================================
// AuthProvider — enveloppe toute l'application dans App.js
// Tous les composants enfants peuvent accéder au contexte
// ============================================================
export const AuthProvider = ({ children }) => {

  // user    : infos de l'utilisateur connecté (ou null si déconnecté)
  // token   : le Bearer Token JWT (ou null)
  // loading : true pendant la vérification initiale du token stocké
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // Au démarrage de l'app, on vérifie si un token est déjà
  // sauvegardé dans AsyncStorage (l'utilisateur s'était
  // connecté lors d'une session précédente).
  // Si oui → il reste connecté automatiquement.
  // Si non → il voit l'écran de connexion.
  // ----------------------------------------------------------
  useEffect(() => {
    checkStoredToken();
  }, []);

  const checkStoredToken = async () => {
    try {
      // Lire le token et les infos user dans le stockage local
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser  = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        // Token trouvé → on remet l'utilisateur connecté
        setToken(storedToken);
        setUser(JSON.parse(storedUser)); // storedUser est une string JSON
      }
    } catch (error) {
      console.log('Erreur lecture AsyncStorage:', error);
    } finally {
      // Dans tous les cas on arrête le chargement
      // (que le token existe ou non)
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // LOGIN
  // Appelé depuis LoginScreen quand l'utilisateur soumet le formulaire
  // 1. On appelle l'API Laravel POST /api/auth/login
  // 2. Laravel vérifie les identifiants et retourne { token, user }
  // 3. On sauvegarde dans AsyncStorage (persistance)
  // 4. On met à jour le state React → l'app bascule vers les onglets
  // ----------------------------------------------------------
  const login = async (email, password) => {
    // Appel à l'API via la fonction importée depuis api.js
    const response = await apiLogin(email, password);

    // L'API retourne : { message, token, user }
    const { token: newToken, user: newUser } = response.data;

    // Sauvegarder le token en local pour les prochains démarrages
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    // Sauvegarder les infos user (JSON.stringify car AsyncStorage
    // ne stocke que des strings)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

    // Mettre à jour le state → déclenche le re-render de l'app
    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  // ----------------------------------------------------------
  // LOGOUT
  // 1. On appelle l'API pour révoquer le token côté serveur
  // 2. On supprime le token du stockage local
  // 3. On remet user et token à null → l'app revient au Login
  // ----------------------------------------------------------
  const logout = async () => {
    try {
      // Révoquer le token côté Laravel
      // (le token ne pourra plus être utilisé même s'il est volé)
      await apiLogout();
    } catch {
      // Si le réseau est coupé, on déconnecte quand même localement
    } finally {
      // Nettoyer le stockage local
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      // Remettre à null → AppNavigator détecte isAuthenticated=false
      // et affiche automatiquement l'écran de Login
      setToken(null);
      setUser(null);
    }
  };

  // ----------------------------------------------------------
  // UPDATE USER
  // Utilisé après modification du profil pour mettre à jour
  // les infos affichées sans avoir à se reconnecter
  // ----------------------------------------------------------
  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  // ----------------------------------------------------------
  // Valeurs exposées à toute l'application
  // Tout composant qui appelle useAuth() reçoit ces valeurs
  // ----------------------------------------------------------
  return (
    <AuthContext.Provider value={{
      user,             // { id, name, email, role, avatar... }
      token,            // Le Bearer Token JWT
      loading,          // true pendant la vérification initiale
      login,            // fonction : login(email, password)
      logout,           // fonction : logout()
      updateUser,       // fonction : updateUser(newUserData)
      isAuthenticated: !!token, // true si connecté, false sinon
      // !! convertit le token en booléen :
      // null → false, "1|abc..." → true
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// useAuth — Hook personnalisé
//
// Usage dans n'importe quel écran :
//   const { user, login, logout, isAuthenticated } = useAuth();
//
// Lance une erreur si utilisé hors du AuthProvider
// (protection contre les mauvaises utilisations)
// ============================================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};