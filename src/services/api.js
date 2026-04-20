import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../utils/constants';

// Instance Axios avec l'URL de base de l'API Laravel
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  timeout: 15000,
});

// Avant chaque requête : ajouter le token Bearer automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Si l'API répond 401 (token expiré) : nettoyer AsyncStorage
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('elyon_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Authentification ────────────────────────────────────────

// Connexion — retourne { token, user }
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// Inscription — retourne { token, user }
export const register = (data) =>
  api.post('/auth/register', data);

// Déconnexion — révoque le token
export const logout = () =>
  api.post('/auth/logout');

// Mot de passe oublié — envoie un email
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

// Récupérer le profil de l'utilisateur connecté
export const getProfil = () =>
  api.get('/auth/profil');

// Modifier le profil (nom, email, téléphone)
export const updateProfile = (data) =>
  api.put('/auth/profile', data);

// Changer le mot de passe
export const changePassword = (data) =>
  api.put('/auth/change-password', data);

// Supprimer le compte définitivement
export const deleteAccount = (password) =>
  api.delete('/auth/account', { data: { password } });

// ── Services (types de visa) ────────────────────────────────

// Liste de tous les services
export const getServices = () =>
  api.get('/services');

// Détail d'un service
export const getService = (id) =>
  api.get(`/services/${id}`);

// ── Dossiers ────────────────────────────────────────────────

// Liste des dossiers du client connecté
export const getDossiers = () =>
  api.get('/dossiers');

// Détail d'un dossier
export const getDossier = (id) =>
  api.get(`/dossiers/${id}`);

// Créer un nouveau dossier
export const createDossier = (serviceId) =>
  api.post('/dossiers', { service_id: serviceId });

// ── Documents ───────────────────────────────────────────────

// Uploader un document (multipart/form-data)
export const uploadDocument = (dossierId, documentRequisId, file) => {
  const formData = new FormData();
  formData.append('document_requis_id', documentRequisId);
  formData.append('fichier', {
    uri:  file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  });
  return api.post(`/dossiers/${dossierId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Messagerie ──────────────────────────────────────────────

// Historique des messages d'un dossier
export const getMessages = (dossierId) =>
  api.get(`/dossiers/${dossierId}/messages`);

// Envoyer un message
export const sendMessage = (dossierId, contenu) =>
  api.post(`/dossiers/${dossierId}/messages`, { contenu });