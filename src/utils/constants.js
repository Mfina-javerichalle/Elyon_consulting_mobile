// ============================================================
// src/utils/constants.js
// Couleurs exactes du site elyon-consulting.com
// ============================================================

export const API_URL   = 'https://elyon-consulting.com/api';
export const TOKEN_KEY = 'elyon_token';
export const USER_KEY  = 'elyon_user';

export const COLORS = {
  primary:    '#1B2B6B',   // Bleu foncé — header, navbar, fond auth
  secondary:  '#243580',   // Bleu légèrement plus clair — boutons, cards header
  accent:     '#1B2B6B',   // Boutons principaux — bleu foncé comme le site
  accentHover:'#243580',   // Boutons au survol
  blue:       '#3B5BDB',   // Bleu ciel — liens, icônes actives
  white:      '#FFFFFF',   // Fond des cartes
  lightGray:  '#F0F4FF',   // Fond des pages
  gray:       '#6B7280',   // Textes secondaires
  darkGray:   '#111827',   // Textes principaux
  border:     '#E2E8F0',   // Bordures

  // Statuts
  status: {
    en_attente: '#F59E0B',  // Ambre
    en_cours:   '#3B5BDB',  // Bleu ciel
    valide:     '#22C55E',  // Vert
    refuse:     '#EF4444',  // Rouge
  },
};

export const STATUS_LABELS = {
  en_attente: 'En attente',
  en_cours:   'En cours',
  valide:     'Validé',
  refuse:     'Refusé',
};