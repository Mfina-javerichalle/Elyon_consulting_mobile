// ============================================================
// src/screens/Tabs/ServicesScreen.js
//
// Design calqué sur elyon-consulting.com
// Icônes : Ionicons (@expo/vector-icons) — vectorielles pro
// Drapeaux : flagcdn.com (CDN gratuit, zéro fichier local)
//
// ── Pour utiliser des images locales à la place du CDN ──────
//   1. Crée le dossier : src/assets/flags/
//   2. Copie-y : fr.png, ca.png, be.png, lu.png, us.png
//      (récupère-les sur https://flagcdn.com ou ton dossier
//       Laravel public/images/flags/)
//   3. Remplace getFlagUrl() par :
//        const FLAGS = {
//          France:     require('../../assets/flags/fr.png'),
//          Canada:     require('../../assets/flags/ca.png'),
//          ...
//        };
//   4. Dans <CardBanner> : source={FLAGS[pays]} au lieu de
//        source={{ uri: getFlagUrl(pays) }}
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getServices } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { COLORS } from '../../utils/constants';

// ── Codes ISO pour flagcdn.com ────────────────────────────────
// Retourne une image drapeau 320px de large, gratuite et rapide
const FLAG_CODES = {
  France:     'fr',
  Canada:     'ca',
  Belgique:   'be',
  Luxembourg: 'lu',
  USA:        'us',
};

// Construit l'URL du drapeau à partir du nom du pays
const getFlagUrl = (pays) => {
  const code = FLAG_CODES[pays];
  return code ? `https://flagcdn.com/w320/${code}.png` : null;
};

// ── Couleur de fond de la card pendant le chargement ─────────
const BANNER_BG = {
  France:     '#002395',
  Canada:     '#CC0001',
  Belgique:   '#1e1e1e',
  Luxembourg: '#EF3340',
  USA:        '#3C3B6E',
};

// ── Nom d'icône Ionicons selon le type de visa ───────────────
const getVisaIcon = (nom) => {
  const n = nom?.toLowerCase() || '';
  if (n.includes('étudiant') || n.includes('etudiant')) return 'school-outline';
  if (n.includes('touristique') || n.includes('tourisme')) return 'airplane-outline';
  if (n.includes('travail') || n.includes('professionnel')) return 'briefcase-outline';
  if (n.includes('famille') || n.includes('regroupement')) return 'people-outline';
  return 'earth-outline';
};

// ─────────────────────────────────────────────────────────────

const ServicesScreen = ({ navigation }) => {

  const { user } = useAuth();

  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // ── Chargement des services depuis l'API ─────────────────
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

  // ────────────────────────────────────────────────────────
  // Composant : Bannière haute colorée de la card
  // Image drapeau + overlay sombre + badge icône visa
  // Reproduit ".card-flag-header" du HTML
  // ────────────────────────────────────────────────────────
  const CardBanner = ({ pays, nom }) => {
    const flagUrl  = getFlagUrl(pays);
    const bgColor  = BANNER_BG[pays] || COLORS.primary;
    const iconName = getVisaIcon(nom);

    return (
      <View style={[styles.cardBanner, { backgroundColor: bgColor }]}>

        {/* Image drapeau chargée depuis flagcdn.com */}
        {flagUrl ? (
          <Image
            source={{ uri: flagUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}

        {/* Overlay sombre en bas — simule le gradient du web */}
        <View style={styles.bannerOverlay} />

        {/* Badge icône type de visa — bas droite */}
        <View style={styles.bannerIconBadge}>
          <Ionicons name={iconName} size={16} color="#fff" />
        </View>

      </View>
    );
  };

  // ────────────────────────────────────────────────────────
  // Composant : Chip d'info rapide (documents / étapes / frais)
  // Reproduit ".infoChip" du web
  // ────────────────────────────────────────────────────────
  const InfoChip = ({ iconName, label }) => (
    <View style={styles.chip}>
      <Ionicons name={iconName} size={11} color={COLORS.gray} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );

  // ────────────────────────────────────────────────────────
  // Rendu d'une card de service
  // Reproduit ".service-card" du HTML
  // ────────────────────────────────────────────────────────
  const renderService = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', { service: item })}
      activeOpacity={0.88}
    >
      {/* ── Bannière drapeau ── */}
      <CardBanner pays={item.pays} nom={item.nom} />

      <View style={styles.cardBody}>

        {/* Badge pays — reproduit ".card-country-badge" */}
        <View style={styles.paysBadge}>
          <Ionicons name="location-sharp" size={11} color={COLORS.primary} />
          <Text style={styles.paysText}>{item.pays}</Text>
        </View>

        {/* Délai de traitement */}
        {item.infos_visa?.delai ? (
          <View style={styles.delaiRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray} />
            <Text style={styles.delaiText}>{item.infos_visa.delai}</Text>
          </View>
        ) : null}

        {/* Nom du service — reproduit ".card-service-name" */}
        <Text style={styles.serviceName}>{item.nom}</Text>

        {/* Description tronquée — reproduit ".card-description" */}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Chips infos rapides */}
        <View style={styles.chipRow}>
          {item.documents?.length > 0 && (
            <InfoChip
              iconName="document-text-outline"
              label={`${item.documents.length} document${item.documents.length > 1 ? 's' : ''}`}
            />
          )}
          {item.etapes?.length > 0 && (
            <InfoChip
              iconName="list-outline"
              label={`${item.etapes.length} étape${item.etapes.length > 1 ? 's' : ''}`}
            />
          )}
          {item.infos_visa?.frais ? (
            <InfoChip
              iconName="cash-outline"
              label={`${item.infos_visa.frais} €`}
            />
          ) : null}
        </View>

        {/* Pied de carte — reproduit ".cardFooter" */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel}>Voir la procédure complète</Text>
          <View style={styles.arrowBtn}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );

  // ────────────────────────────────────────────────────────
  // En-tête de la FlatList : Hero + titre section
  // Reproduit ".services-hero" + ".sectionHeader" du HTML
  // ────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>

      {/* ── HERO ── */}
      <View style={styles.hero}>

        {/* Badge "Nos Destinations" */}
        <View style={styles.heroBadge}>
          <Ionicons name="earth-outline" size={13} color="#fff" />
          <Text style={styles.heroBadgeText}>Nos Destinations</Text>
        </View>

        {/* Salutation personnalisée */}
        <Text style={styles.heroGreeting}>
          Bonjour, {user?.name?.split(' ')[0] || 'Client'}
        </Text>

        {/* Titre avec highlight doré */}
        <Text style={styles.heroTitle}>
          Votre visa,{'\n'}
          <Text style={styles.heroHighlight}>notre expertise</Text>
        </Text>

        {/* Sous-titre */}
        <Text style={styles.heroSubtitle}>
          Orientation · Dossier visa · Logement étudiant ·
          Billetterie · Installation complète.
        </Text>

        {/* Barre de stats — reproduit ".statsRow" */}
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

      {/* ── Titre section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nos services disponibles</Text>
        <Text style={styles.sectionSubtitle}>
          {services.length} destination{services.length > 1 ? 's' : ''} — Choisissez votre projet
        </Text>
      </View>

    </View>
  );

  // ────────────────────────────────────────────────────────
  // Pied de liste : CTA + note WhatsApp
  // ────────────────────────────────────────────────────────
  const ListFooter = () => (
    <View>

      {/* Bandeau CTA — reproduit ".cta-banner" */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaTitle}>Votre projet commence ici</Text>
        <Text style={styles.ctaSubtitle}>
          Créez votre dossier et démarrez votre procédure en quelques minutes.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('TabDossiers')}
        >
          <Ionicons name="folder-open-outline" size={16} color={COLORS.primary} />
          <Text style={styles.ctaBtnText}>Accéder à mes dossiers</Text>
        </TouchableOpacity>
      </View>

      {/* Note WhatsApp */}
      <View style={styles.footerNote}>
        <Ionicons name="logo-whatsapp" size={14} color={COLORS.gray} />
        <Text style={styles.footerNoteText}>
          Une question ? +242 04 471 47 07
        </Text>
      </View>

    </View>
  );

  // ── États loading / erreur ───────────────────────────────
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
        <Ionicons name="warning-outline" size={40} color={COLORS.gray} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadServices}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Rendu principal ──────────────────────────────────────
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
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="earth-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>Aucun service disponible pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
};

// ============================================================
// STYLES — nommage calqué sur les classes CSS du site web
// ============================================================
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // ── Hero ─────────────────────────────────────────────────
  hero: {
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 20,
    paddingTop:        24,
    paddingBottom:     28,
  },
  heroBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(255,255,255,0.15)',
    borderRadius:      999,
    paddingHorizontal: 12,
    paddingVertical:   5,
    marginBottom:      14,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroGreeting:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  heroTitle: {
    fontSize:     26,
    fontWeight:   '900',
    color:        '#fff',
    lineHeight:   33,
    marginBottom: 10,
  },
  heroHighlight: { color: '#f0a500' },           // accent doré du site
  heroSubtitle: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.7)',
    lineHeight:   19,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection:   'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    14,
    paddingVertical: 14,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statNumber:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  statLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },

  // ── Section header ────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     10,
  },
  sectionTitle:    { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sectionSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  // ── Liste ─────────────────────────────────────────────────
  list: { paddingHorizontal: 16, paddingBottom: 24 },

  // ── Card ─────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius:    16,
    marginBottom:    16,
    overflow:        'hidden',       // découpe le drapeau sur les coins
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
  },

  // Bannière drapeau — reproduit ".card-flag-header"
  cardBanner: {
    height:   150,
    position: 'relative',
  },
  // Overlay dégradé bas — assombrit pour lisibilité
  bannerOverlay: {
    position:        'absolute',
    bottom:          0, left: 0, right: 0,
    height:          '55%',
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  // Badge icône visa (bas droite)
  bannerIconBadge: {
    position:        'absolute',
    bottom:          12,
    right:           12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius:    10,
    padding:         8,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.28)',
  },

  // Corps de card
  cardBody: { padding: 16 },

  // Badge pays
  paysBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(10,36,99,0.07)',
    borderRadius:      999,
    paddingHorizontal: 10,
    paddingVertical:   4,
    marginBottom:      6,
  },
  paysText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Délai
  delaiRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginBottom:  6,
  },
  delaiText: { fontSize: 12, color: COLORS.gray },

  // Nom service
  serviceName: {
    fontSize:     16,
    fontWeight:   '800',
    color:        COLORS.primary,
    marginBottom: 6,
  },

  // Description courte
  description: {
    fontSize:     13,
    color:        COLORS.gray,
    lineHeight:   19,
    marginBottom: 12,
  },

  // Chips infos rapides
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   '#F8FAFF',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       COLORS.border || '#e2e8f0',
  },
  chipText: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },

  // Pied de carte
  cardFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#e2e8f0',
    paddingTop:     12,
  },
  footerLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },
  arrowBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },

  // ── CTA Banner ───────────────────────────────────────────
  ctaBanner: {
    backgroundColor: COLORS.primary,
    borderRadius:    20,
    margin:          16,
    padding:         24,
    alignItems:      'center',
  },
  ctaTitle: {
    fontSize:     20,
    fontWeight:   '800',
    color:        '#fff',
    marginBottom: 8,
    textAlign:    'center',
  },
  ctaSubtitle: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.72)',
    textAlign:    'center',
    marginBottom: 20,
    lineHeight:   19,
  },
  ctaBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#fff',
    borderRadius:      999,
    paddingHorizontal: 24,
    paddingVertical:   12,
  },
  ctaBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  // Note WhatsApp
  footerNote: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 16,
    paddingBottom:  16,
    justifyContent: 'center',
  },
  footerNoteText: { fontSize: 12, color: COLORS.gray },

  // ── États ─────────────────────────────────────────────────
  loadingText: { color: COLORS.gray, marginTop: 12, fontSize: 14 },
  errorText:   { color: COLORS.gray, textAlign: 'center', marginVertical: 12 },
  retryBtn:    { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText:   { color: '#fff', fontWeight: '600' },
  emptyText:   { color: COLORS.gray, fontSize: 15, textAlign: 'center', marginTop: 12 },
});

export default ServicesScreen;