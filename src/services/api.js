// ============================================================
// src/services/api.js
//
// Instance Axios centralisée pour toute l'application.
//
// NOUVEAUTÉS :
//   - getUnreadCount()     → GET /dossiers/messages/unread-count
//     Retourne le nombre total de messages non lus sur tous
//     les dossiers du client. Utilisé pour le badge de l'onglet.
//
//   - markMessagesAsRead() → POST /dossiers/{id}/messages/read
//     Marque tous les messages d'un dossier comme lus.
//     Appelé automatiquement à l'ouverture de la conversation.
//
// UPLOAD DOCUMENT :
//   - Vérifié et corrigé pour garantir la compatibilité avec
//     le back-office Laravel (multipart/form-data).
//   - Le fichier est transmis avec uri, name et type corrects.
//   - L'administrateur voit le document immédiatement après upload.
// ============================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../utils/constants';

// ── Instance Axios ────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  timeout: 15000,
});

// ── Intercepteur requête : injecter le token Bearer ──────────
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

// ── Intercepteur réponse : gérer le 401 (token expiré) ──────
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

// ── Authentification ──────────────────────────────────────────

// Connexion → retourne { token, user }
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// Inscription → retourne { token, user }
export const register = (data) =>
  api.post('/auth/register', data);

// Déconnexion → révoque le token côté serveur
export const logout = () =>
  api.post('/auth/logout');

// Mot de passe oublié → envoie un email de réinitialisation
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

// ── Services (types de visa) ──────────────────────────────────

// Liste de tous les services disponibles
export const getServices = () =>
  api.get('/services');

// Détail d'un service spécifique
export const getService = (id) =>
  api.get(`/services/${id}`);

// ── Dossiers ─────────────────────────────────────────────────

// Liste des dossiers du client connecté
export const getDossiers = () =>
  api.get('/dossiers');

// Détail d'un dossier (avec documents et étapes)
export const getDossier = (id) =>
  api.get(`/dossiers/${id}`);

// Créer un nouveau dossier pour un service donné
export const createDossier = (serviceId) =>
  api.post('/dossiers', { service_id: serviceId });

// ── Documents ─────────────────────────────────────────────────

// Uploader un document (multipart/form-data)
//
// IMPORTANT pour la synchronisation mobile ↔ web :
//   - Le champ "fichier" doit correspondre exactement au nom
//     attendu par le contrôleur Laravel.
//   - Le type MIME doit être précis pour que Laravel Storage
//     enregistre le fichier avec la bonne extension.
//   - Après upload réussi, le document apparaît immédiatement
//     dans le back-office web car il est stocké dans
//     storage/app/public/documents/ et accessible via
//     /storage/documents/{filename}.
//
export const uploadDocument = (dossierId, documentRequisId, file) => {
  const formData = new FormData();

  // ID du document requis (référence vers DocumentRequis en BDD)
  formData.append('document_requis_id', String(documentRequisId));

  // Fichier lui-même — format attendu par React Native FormData
  formData.append('fichier', {
    uri:  file.uri,                              // chemin local sur le device
    name: file.name || `document_${Date.now()}`, // nom du fichier
    type: file.mimeType || 'application/octet-stream', // type MIME
  });

  return api.post(`/dossiers/${dossierId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      // Ne pas laisser Axios écraser le Content-Type :
      // React Native gère automatiquement le boundary
    },
    // Timeout plus long pour les uploads de fichiers lourds
    timeout: 60000,
  });
};

// ── Messagerie ────────────────────────────────────────────────

// Historique des messages d'un dossier
// Retourne { messages: [...] }
// Chaque message contient : id, contenu, is_mine, created_at, sender
export const getMessages = (dossierId) =>
  api.get(`/dossiers/${dossierId}/messages`);

// Envoyer un nouveau message dans un dossier
export const sendMessage = (dossierId, contenu) =>
  api.post(`/dossiers/${dossierId}/messages`, { contenu });

// ── NOUVEAU : Nombre total de messages non lus ────────────────
//
// Endpoint attendu côté Laravel :
//   GET /api/dossiers/messages/unread-count
//   Retourne : { unread_count: 3 }
//
// Si cet endpoint n'existe pas encore dans ton Laravel,
// voici le code à ajouter dans routes/api.php :
//   Route::get('dossiers/messages/unread-count', [MessageController::class, 'unreadCount']);
//
// Et dans MessageController.php :
//   public function unreadCount() {
//     $count = Message::whereHas('dossier', fn($q) => $q->where('user_id', auth()->id()))
//              ->where('is_read', false)
//              ->where('sender_id', '!=', auth()->id())
//              ->count();
//     return response()->json(['unread_count' => $count]);
//   }
//
export const getUnreadCount = () =>
  api.get('/dossiers/messages/unread-count');

// ── NOUVEAU : Marquer les messages d'un dossier comme lus ────
//
// Endpoint attendu côté Laravel :
//   POST /api/dossiers/{id}/messages/read
//   Retourne : { success: true }
//
// Code Laravel à ajouter dans routes/api.php :
//   Route::post('dossiers/{id}/messages/read', [MessageController::class, 'markAsRead']);
//
// Et dans MessageController.php :
//   public function markAsRead($dossierId) {
//     Message::where('dossier_id', $dossierId)
//            ->where('sender_id', '!=', auth()->id())
//            ->update(['is_read' => true]);
//     return response()->json(['success' => true]);
//   }
//
export const markMessagesAsRead = (dossierId) =>
  api.post(`/dossiers/${dossierId}/messages/read`);