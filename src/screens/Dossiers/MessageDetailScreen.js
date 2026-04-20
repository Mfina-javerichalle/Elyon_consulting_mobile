// ============================================================
// src/screens/Dossiers/MessageDetailScreen.js
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { getMessages, sendMessage } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { COLORS } from '../../utils/constants';

const MessageDetailScreen = ({ route }) => {

  const { dossierId, dossierNom } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [text,     setText]     = useState('');

  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const res = await getMessages(dossierId);
      setMessages(res.data.messages);
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
      console.log('Envoi message — dossierId:', dossierId, 'contenu:', trimmed);
      await sendMessage(dossierId, trimmed);
      await loadMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err) {
      console.log('Erreur envoi:', err.response?.data);
      console.log('Status:', err.response?.status);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.is_mine;

    const showDate = index === 0 || (
      messages[index - 1] &&
      item.created_at.split(' ')[0] !== messages[index - 1].created_at.split(' ')[0]
    );

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {item.created_at.split(' ')[0]}
            </Text>
          </View>
        )}

        <View style={[styles.messageRow, isMe ? styles.messageRight : styles.messageLeft]}>

          {!isMe && (
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>EC</Text>
            </View>
          )}

          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            {!isMe && (
              <Text style={styles.senderName}>
                {item.sender?.name || 'Elyon Consulting'} — Conseiller
              </Text>
            )}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.contenu}
            </Text>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {item.created_at.split(' ')[1] || item.created_at}
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

      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderIcon}>
          <Text style={styles.chatHeaderIconText}>EC</Text>
        </View>
        <View>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {dossierNom || 'Conversation'}
          </Text>
          <Text style={styles.chatSubtitle}>Elyon Consulting — Conseiller</Text>
        </View>
      </View>

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
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptyText}>
              Envoyez un message à votre conseiller Elyon Consulting.
            </Text>
          </View>
        }
      />

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
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  chatHeader: {
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical:   12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
  },
  chatHeaderIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  chatHeaderIconText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  chatTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.white },
  chatSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  messageList:  { padding: 16, paddingBottom: 8 },
  messageRow:   { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end' },
  messageLeft:  { justifyContent: 'flex-start' },
  messageRight: { justifyContent: 'flex-end' },

  adminAvatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.primary,
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     8,
    marginBottom:    4,
  },
  adminAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: 11 },

  bubble: {
    maxWidth:     '75%',
    borderRadius: 18,
    padding:      12,
    paddingBottom: 8,
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
  messageTimeMe: { color: 'rgba(255,255,255,0.65)' },

  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    backgroundColor:   COLORS.border,
    color:             COLORS.gray,
    fontSize:          12,
    paddingHorizontal: 12,
    paddingVertical:   4,
    borderRadius:      20,
  },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    backgroundColor: COLORS.white,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    padding:         12,
    paddingBottom:   16,
    gap:             8,
  },
  input: {
    flex:              1,
    backgroundColor:   COLORS.lightGray,
    borderRadius:      24,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          15,
    color:             COLORS.darkGray,
    maxHeight:         100,
    borderWidth:       1.5,
    borderColor:       COLORS.border,
  },
  sendBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon:        { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default MessageDetailScreen;