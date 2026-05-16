// ============================================================
// src/screens/Dossiers/MessageDetailScreen.js
//
// Écran de conversation avec le conseiller Elyon Consulting
//
// NOUVEAUTÉS :
//
//   1. FUSEAU HORAIRE LOCAL
//      Les dates UTC reçues de l'API sont converties
//      automatiquement dans le fuseau horaire du téléphone.
//      Utilise Intl.DateTimeFormat avec le timezone local.
//      Ex: "2026-05-16T12:00:00Z" → "14:00" en France,
//          "08:00" à New York.
//
//   2. MARK AS READ
//      À l'ouverture de la conversation, tous les messages
//      sont marqués comme lus via markMessagesAsRead().
//      Le badge de l'onglet Messages est ainsi réinitialisé.
//
//   3. ICÔNES IONICONS — plus d'emojis dans l'UI
//
//   4. POLLING — rafraîchissement automatique toutes les 30s
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMessages, sendMessage, markMessagesAsRead } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { COLORS } from '../../utils/constants';

// ─────────────────────────────────────────────────────────────
// Utilitaires de formatage des dates en heure locale
// ─────────────────────────────────────────────────────────────

// Fuseau horaire du téléphone de l'utilisateur
// Ex : "Europe/Paris", "America/New_York", "Africa/Brazzaville"
const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Formate une date ISO UTC en heure locale (HH:MM)
 * @param {string} dateStr  — "2026-05-16T12:00:00Z" ou "2026-05-16 12:00:00"
 * @returns {string}         — "14:00" (si timezone Europe/Paris)
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    // Normaliser : remplacer l'espace par "T" si besoin
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    // Ajouter "Z" si pas de timezone explicite (API Laravel renvoie souvent sans)
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized
      : normalized + 'Z';

    return new Intl.DateTimeFormat('fr-FR', {
      hour:     '2-digit',
      minute:   '2-digit',
      timeZone: USER_TIMEZONE,
    }).format(new Date(withZ));
  } catch {
    // Fallback : afficher tel quel si parsing échoue
    return dateStr.split(' ')[1]?.slice(0, 5) || dateStr;
  }
};

/**
 * Formate une date ISO UTC en date lisible locale (DD/MM/YYYY)
 * @param {string} dateStr
 * @returns {string} — "16/05/2026"
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized
      : normalized + 'Z';

    return new Intl.DateTimeFormat('fr-FR', {
      day:      '2-digit',
      month:    '2-digit',
      year:     'numeric',
      timeZone: USER_TIMEZONE,
    }).format(new Date(withZ));
  } catch {
    return dateStr.split(' ')[0] || dateStr;
  }
};

/**
 * Retourne la date locale (YYYY-MM-DD) pour comparer les jours
 * et afficher les séparateurs de date.
 */
const getLocalDateKey = (dateStr) => {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized
      : normalized + 'Z';
    const d = new Date(withZ);
    // Format YYYY-MM-DD dans le timezone local
    return new Intl.DateTimeFormat('fr-CA', { // fr-CA = YYYY-MM-DD
      timeZone: USER_TIMEZONE,
    }).format(d);
  } catch {
    return dateStr.split(' ')[0] || dateStr;
  }
};

// ─────────────────────────────────────────────────────────────

const MessageDetailScreen = ({ route, navigation }) => {

  const { dossierId, dossierNom } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [text,     setText]     = useState('');

  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Marquer comme lus + charger dès l'ouverture ─────────
  useFocusEffect(
    useCallback(() => {
      loadMessages(true); // true = marquer comme lus
      intervalRef.current = setInterval(() => loadMessages(false), 30000);
      return () => clearInterval(intervalRef.current);
    }, [dossierId])
  );

  /**
   * Charge les messages du dossier.
   * @param {boolean} markRead — si true, marque les messages comme lus
   *                             et réinitialise le badge de l'onglet.
   */
  const loadMessages = async (markRead = false) => {
    try {
      const res = await getMessages(dossierId);
      setMessages(res.data.messages);

      // Marquer comme lus si demandé (à l'ouverture de l'écran)
      if (markRead) {
        try {
          await markMessagesAsRead(dossierId);
          // Notifier AppNavigator de rafraîchir le badge
          const parent = navigation.getParent('TabMessagerie');
          if (parent?.fetchUnreadCount) parent.fetchUnreadCount();
        } catch {
          // Non bloquant : le badge sera corrigé au prochain polling
        }
      }
    } catch (err) {
      console.log('Erreur chargement messages:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // ── Envoyer un message ───────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setText('');

    try {
      await sendMessage(dossierId, trimmed);
      await loadMessages(false);
      // Scroll vers le bas après envoi
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err) {
      console.log('Erreur envoi:', err.response?.data);
      setText(trimmed); // Restaurer si erreur
    } finally {
      setSending(false);
    }
  };

  // ── Rendu d'un message ───────────────────────────────────
  const renderMessage = ({ item, index }) => {
    const isMe = item.is_mine;

    // Afficher un séparateur de date quand le jour change
    const currentDateKey  = getLocalDateKey(item.created_at);
    const previousDateKey = index > 0
      ? getLocalDateKey(messages[index - 1].created_at)
      : null;
    const showDate = index === 0 || currentDateKey !== previousDateKey;

    // Heure locale formatée (utilise Intl avec timezone du téléphone)
    const timeFormatted = formatTime(item.created_at);
    const dateFormatted = formatDate(item.created_at);

    return (
      <View>
        {/* Séparateur de date — ex: "16/05/2026" */}
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{dateFormatted}</Text>
          </View>
        )}

        <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>

          {/* Avatar conseiller */}
          {!isMe && (
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>EC</Text>
            </View>
          )}

          {/* Bulle de message */}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>

            {/* Nom expéditeur (côté conseiller) */}
            {!isMe && (
              <Text style={styles.senderName}>
                {item.sender?.name || 'Elyon Consulting'}
              </Text>
            )}

            {/* Contenu du message */}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.contenu}
            </Text>

            {/* Heure locale — ex: "14:00" */}
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {timeFormatted}
            </Text>

          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >

      {/* ── En-tête conversation ── */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderAvatar}>
          <Text style={styles.chatHeaderAvatarText}>EC</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {dossierNom || 'Conversation'}
          </Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.chatSubtitle}>Elyon Consulting — Conseiller</Text>
          </View>
        </View>
      </View>

      {/* ── Liste des messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptyText}>
              Envoyez un message à votre conseiller Elyon Consulting.
            </Text>
          </View>
        }
      />

      {/* ── Barre de saisie ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          placeholderTextColor={COLORS.gray}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Ionicons name="send" size={18} color={COLORS.white} />
          }
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // En-tête
  chatHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  chatHeaderAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  chatHeaderAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  chatTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.white },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  chatSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow:  { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end' },
  rowLeft:     { justifyContent: 'flex-start' },
  rowRight:    { justifyContent: 'flex-end' },

  adminAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, marginBottom: 4,
  },
  adminAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: 11 },

  bubble: {
    maxWidth: '75%', borderRadius: 18, padding: 12, paddingBottom: 8,
  },
  bubbleMe: {
    backgroundColor:         COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor:        COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor:            '#000',
    shadowOffset:           { width: 0, height: 1 },
    shadowOpacity:          0.08,
    shadowRadius:           3,
    elevation:              2,
  },

  senderName:    { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  messageText:   { fontSize: 15, color: COLORS.darkGray, lineHeight: 21 },
  messageTextMe: { color: COLORS.white },
  messageTime:   { fontSize: 10, color: COLORS.gray, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(255,255,255,0.6)' },

  // Séparateur de date
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    backgroundColor: COLORS.border || '#e2e8f0',
    color: COLORS.gray, fontSize: 11,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },

  // État vide
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Barre de saisie
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border || '#e2e8f0',
    padding: 12, paddingBottom: 16, gap: 8,
  },
  input: {
    flex: 1, backgroundColor: COLORS.lightGray || '#f8fafc',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: COLORS.darkGray, maxHeight: 100,
    borderWidth: 1.5, borderColor: COLORS.border || '#e2e8f0',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});

export default MessageDetailScreen;