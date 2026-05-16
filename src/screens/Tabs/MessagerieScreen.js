// ============================================================
// src/screens/Tabs/MessagerieScreen.js
//
// Liste des conversations (une par dossier)
//
// NOUVEAUTÉS :
//   - À l'ouverture de l'écran, réinitialise le badge de
//     l'onglet en appelant resetUnreadCount() passé depuis
//     AppNavigator via les props de la Stack.
//   - Icônes Ionicons — plus d'emojis dans l'UI
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDossiers } from '../../services/api';
import { COLORS, STATUS_LABELS } from '../../utils/constants';

const MessagerieScreen = ({ navigation, route }) => {

  const [dossiers,   setDossiers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Chargement initial ───────────────────────────────────
  useEffect(() => { loadDossiers(); }, []);

  // ── Quand l'onglet reprend le focus ─────────────────────
  // → recharger les conversations ET réinitialiser le badge
  useFocusEffect(
    useCallback(() => {
      loadDossiers();

      // Réinitialiser le badge dans AppNavigator
      // resetUnreadCount est passé en prop depuis MainTabs
      const parent = navigation.getParent();
      if (parent?.resetUnreadCount) {
        parent.resetUnreadCount();
      }
    }, [navigation])
  );

  const loadDossiers = async () => {
    try {
      const res = await getDossiers();
      setDossiers(res.data.dossiers);
    } catch {
      setDossiers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDossiers();
  }, []);

  // ── Rendu d'une conversation ─────────────────────────────
  const renderDossier = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MessageDetail', {
        dossierId:  item.id,
        dossierNom: item.service?.nom,
      })}
      activeOpacity={0.8}
    >
      {/* Avatar "EC" Elyon Consulting */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>EC</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Nom du dossier + date */}
        <View style={styles.cardTop}>
          <Text style={styles.dossierName} numberOfLines={1}>
            {item.service?.nom}
          </Text>
          <Text style={styles.date}>{item.created_at}</Text>
        </View>

        {/* Pays */}
        <View style={styles.paysRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.pays}>{item.service?.pays}</Text>
        </View>

        {/* Badge statut */}
        <View style={[styles.badge,
          { backgroundColor: COLORS.status[item.statut] + '22' }]}>
          <Text style={[styles.badgeText, { color: COLORS.status[item.statut] }]}>
            {STATUS_LABELS[item.statut] || item.statut}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* En-tête */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Messagerie</Text>
        <Text style={styles.pageSubtitle}>
          {dossiers.length} conversation(s)
        </Text>
      </View>

      <FlatList
        data={dossiers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDossier}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyText}>
              Créez un dossier pour démarrer une conversation avec votre conseiller.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  pageTitle:    { fontSize: 20, fontWeight: '800', color: COLORS.white },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  list: { padding: 16 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dossierName: {
    fontSize: 15, fontWeight: '700', color: COLORS.darkGray, flex: 1, marginRight: 8,
  },
  date: { fontSize: 11, color: COLORS.gray },

  paysRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  pays:    { fontSize: 12, color: COLORS.gray },

  badge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
});

export default MessagerieScreen;