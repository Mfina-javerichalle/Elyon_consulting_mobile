// ============================================================
// src/screens/Tabs/ServicesScreen.js
// Design professionnel — cohérent avec elyon-consulting.com
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { getServices } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { COLORS } from '../../utils/constants';

const ServicesScreen = ({ navigation }) => {

  const { user } = useAuth();
  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      setError('');
      const response = await getServices();
      setServices(response.data.services);
    } catch {
      setError('Impossible de charger les services.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadServices();
  }, []);

  // Icône selon le type de visa
  const getServiceIcon = (nom) => {
    const n = nom?.toLowerCase() || '';
    if (n.includes('étudiant') || n.includes('etudiant')) return '🎓';
    if (n.includes('touristique') || n.includes('tourisme')) return '✈️';
    if (n.includes('travail') || n.includes('professionnel')) return '💼';
    if (n.includes('famille') || n.includes('regroupement')) return '👨‍👩‍👧';
    return '🌍';
  };

  const renderService = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', { service: item })}
      activeOpacity={0.85}
    >
      {/* Icône + pays */}
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{getServiceIcon(item.nom)}</Text>
        </View>
        <View style={styles.cardTopRight}>
          <View style={styles.paysBadge}>
            <Text style={styles.paysText}>{item.pays}</Text>
          </View>
          {item.infos_visa?.delai ? (
            <Text style={styles.delai}>⏱ {item.infos_visa.delai}</Text>
          ) : null}
        </View>
      </View>

      {/* Nom du service */}
      <Text style={styles.serviceName}>{item.nom}</Text>

      {/* Description */}
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Infos rapides */}
      <View style={styles.infoRow}>
        {item.documents?.length > 0 && (
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              📄 {item.documents.length} document{item.documents.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {item.etapes?.length > 0 && (
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              🔄 {item.etapes.length} étape{item.etapes.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {item.infos_visa?.frais ? (
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>💰 {item.infos_visa.frais} €</Text>
          </View>
        ) : null}
      </View>

      {/* Pied de carte */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Voir les détails et créer un dossier</Text>
        <View style={styles.arrowBtn}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadServices}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderService}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* ---- Bannière d'accueil ---- */}
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerGreeting}>
                  Bonjour, {user?.name?.split(' ')[0] || 'Client'} 👋
                </Text>
                <Text style={styles.bannerTitle}>
                  Votre visa,{'\n'}notre expertise
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Elyon Consulting vous accompagne de A à Z dans vos démarches de mobilité internationale.
                </Text>
              </View>

              {/* Stats rapides */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>Clients</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>98%</Text>
                  <Text style={styles.statLabel}>Succès</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>15 ans</Text>
                  <Text style={styles.statLabel}>Expertise</Text>
                </View>
              </View>
            </View>

            {/* ---- Titre section services ---- */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nos services disponibles</Text>
              <Text style={styles.sectionSubtitle}>
                {services.length} destination{services.length > 1 ? 's' : ''} — Choisissez votre projet
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🌍</Text>
            <Text style={styles.emptyText}>Aucun service disponible pour le moment.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              💬 Une question ? Contactez-nous via WhatsApp au +242 04 471 47 07
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Bannière
  banner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop:        24,
    paddingBottom:     28,
  },
  bannerContent:  { marginBottom: 20 },
  bannerGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  bannerTitle: {
    fontSize:   28,
    fontWeight: '900',
    color:      COLORS.white,
    lineHeight: 34,
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.7)',
    lineHeight: 19,
  },

  // Stats
  statsRow: {
    flexDirection:   'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius:    14,
    paddingVertical: 14,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statNumber:  { fontSize: 18, fontWeight: '800', color: COLORS.white },
  statLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     10,
  },
  sectionTitle:    { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sectionSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 24 },

  // Carte service
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    marginBottom:    16,
    padding:         18,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginBottom:  14,
  },
  iconContainer: {
    width:           52,
    height:          52,
    borderRadius:    14,
    backgroundColor: '#EEF2FF',
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     14,
  },
  iconText:     { fontSize: 26 },
  cardTopRight: { flex: 1 },
  paysBadge: {
    alignSelf:         'flex-start',
    backgroundColor:   '#EEF2FF',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:    4,
    marginBottom:       6,
  },
  paysText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  delai:    { fontSize: 12, color: COLORS.gray },

  serviceName: { fontSize: 17, fontWeight: '800', color: COLORS.darkGray, marginBottom: 8 },
  description: { fontSize: 13, color: COLORS.gray, lineHeight: 19, marginBottom: 12 },

  // Chips infos rapides
  infoRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  infoChip:  { backgroundColor: '#F8FAFF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  infoChipText: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },

  // Pied de carte
  cardFooter: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    paddingTop:      12,
  },
  footerText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  arrowBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },
  arrowText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // Chargement / Erreur
  loadingText:  { color: COLORS.gray, marginTop: 12, fontSize: 14 },
  errorIcon:    { fontSize: 40, marginBottom: 12 },
  errorText:    { color: COLORS.gray, textAlign: 'center', marginBottom: 16 },
  retryButton:  { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:    { color: COLORS.white, fontWeight: '600' },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { color: COLORS.gray, fontSize: 15, textAlign: 'center' },

  // Footer
  footer: { paddingVertical: 16, alignItems: 'center' },
  footerNote: {
    fontSize:  12,
    color:     COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ServicesScreen;