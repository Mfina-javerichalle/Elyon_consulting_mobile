// ============================================================
// src/screens/Dossiers/MessageDetailScreen.js
//
// Écran de conversation avec le conseiller Elyon Consulting
//
// CORRECTION APPORTÉE :
//
//   BADGE NON LUS — CORRIGÉ
//   Problème : navigation.getParent('TabMessagerie') ne
//   retournait pas un objet avec fetchUnreadCount car
//   React Navigation n'expose pas les fonctions custom
//   via getParent().
//
//   Solution : fetchUnreadCount est récupérée depuis
//   route.params (passée depuis MessagerieStack via
//   initialParams dans AppNavigator).
//
//   Avant (cassé) :
//     const parent = navigation.getParent('TabMessagerie');
//     if (parent?.fetchUnreadCount) parent.fetchUnreadCount();
//
//   Après (corrigé) :
//     const { fetchUnreadCount } = route.params ?? {};
//     if (typeof fetchUnreadCount === 'function') fetchUnreadCount();
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
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

const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized : normalized + 'Z';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', timeZone: USER_TIMEZONE,
    }).format(new Date(withZ));
  } catch {
    return dateStr.split(' ')[1]?.slice(0, 5) || dateStr;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized : normalized + 'Z';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: USER_TIMEZONE,
    }).format(new Date(withZ));
  } catch {
    return dateStr.split(' ')[0] || dateStr;
  }
};

const getLocalDateKey = (dateStr) => {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const withZ = normalized.endsWith('Z') || normalized.includes('+')
      ? normalized : normalized + 'Z';
    return new Intl.DateTimeFormat('fr-CA', { timeZone: USER_TIMEZONE }).format(new Date(withZ));
  } catch {
    return dateStr.split(' ')[0] || dateStr;
  }
};

// ─────────────────────────────────────────────────────────────

const MessageDetailScreen = ({ route, navigation }) => {

  const { dossierId, dossierNom } = route.params;

  // ✅ CORRECTION : récupérer fetchUnreadCount depuis route.params
  // Transmis par MessagerieStack via initialParams dans AppNavigator
  const { fetchUnreadCount } = route.params ?? {};

  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [text,     setText]     = useState('');

  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadMessages(true);
      intervalRef.current = setInterval(() => loadMessages(false), 30000);
      return () => clearInterval(intervalRef.current);
    }, [dossierId])
  );

  const loadMessages = async (markRead = false) => {
    try {
      const res = await getMessages(dossierId);
      setMessages(res.data.messages);

      if (markRead) {
        try {
          await markMessagesAsRead(dossierId);
          // ✅ CORRECTION : appel direct depuis route.params
          // Avant : navigation.getParent('TabMessagerie')?.fetchUnreadCount()
          //         → ne fonctionnait pas
          // Après : fetchUnreadCount?.()
          //         → fonctionne car c'est la vraie fonction passée en param
          if (typeof fetchUnreadCount === 'function') {
            fetchUnreadCount();
          }
        } catch {
          // Non bloquant — le badge sera corrigé au prochain polling (30s)
        }
      }
    } catch (err) {
      console.log('Erreur chargement messages:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setText('');

    try {
      await sendMessage(dossierId, trimmed);
      await loadMessages(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err) {
      console.log('Erreur envoi:', err.response?.data);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.is_mine;
    const currentDateKey  = getLocalDateKey(item.created_at);
    const previousDateKey = index > 0
      ? getLocalDateKey(messages[index - 1].created_at)
      : null;
    const showDate = index === 0 || currentDateKey !== previousDateKey;
    const timeFormatted = formatTime(item.created_at);
    const dateFormatted = formatDate(item.created_at);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{dateFormatted}</Text>
          </View>
        )}

        <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
          {!isMe && (
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>EC</Text>
            </View>
          )}

          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            {!isMe && (
              <Text style={styles.senderName}>
                {item.sender?.name || 'Elyon Consulting'}
              </Text>
            )}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.contenu}
            </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12, paddingBottom: 8 },
  bubbleMe: {
    backgroundColor: COLORS.primary, borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.white, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },

  senderName:    { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  messageText:   { fontSize: 15, color: COLORS.darkGray, lineHeight: 21 },
  messageTextMe: { color: COLORS.white },
  messageTime:   { fontSize: 10, color: COLORS.gray, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(255,255,255,0.6)' },

  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    backgroundColor: COLORS.border || '#e2e8f0',
    color: COLORS.gray, fontSize: 11,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

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