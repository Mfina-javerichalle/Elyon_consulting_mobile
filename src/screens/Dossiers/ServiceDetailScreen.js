// ============================================================
// src/screens/Dossiers/ServiceDetailScreen.js
//
// Design calqué sur show.blade.php — Elyon Consulting
// Icônes : Ionicons (@expo/vector-icons) — vectorielles pro
// Drapeaux : flagcdn.com (même source que ServicesScreen)
//
// Structure :
//   1. Hero  — image drapeau, nom, description, pills d'onglets
//   2. Onglet Documents  — liste avec statut obligatoire/facultatif
//   3. Onglet Étapes     — grille 2 colonnes numérotée
//   4. Onglet Infos Visa — cards délai / frais / ambassade / notes
//   5. Sidebar résumé    — affiché en bas sur mobile
//   6. CTA final         — deux boutons (principal + ghost)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

// ── Codes ISO pour flagcdn.com ────────────────────────────────
const FLAG_CODES = {
  France:     'fr',
  Canada:     'ca',
  Belgique:   'be',
  Luxembourg: 'lu',
  USA:        'us',
};
const getFlagUrl = (pays) => {
  const code = FLAG_CODES[pays];
  return code ? `https://flagcdn.com/w640/${code}.png` : null;
};

// ── Couleur de fond pendant le chargement de l'image ─────────
const BANNER_BG = {
  France:     '#002395',
  Canada:     '#CC0001',
  Belgique:   '#1e1e1e',
  Luxembourg: '#EF3340',
  USA:        '#3C3B6E',
};

// ─────────────────────────────────────────────────────────────

const ServiceDetailScreen = ({ route, navigation }) => {

  const { service } = route.params;

  // Onglet actif : 'documents' | 'etapes' | 'visa'
  const [activeTab, setActiveTab] = useState('documents');

  const flagUrl = getFlagUrl(service.pays);
  const bgColor = BANNER_BG[service.pays] || COLORS.primary;

  // ────────────────────────────────────────────────────────
  // Composant : Pill de navigation
  // Reproduit ".step-pill" du web
  // ────────────────────────────────────────────────────────
  const Pill = ({ id, label, num }) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity
        style={[styles.pill, isActive && styles.pillActive]}
        onPress={() => setActiveTab(id)}
        activeOpacity={0.8}
      >
        {/* Numéro de l'étape — reproduit ".step-pill-num" */}
        <View style={[styles.pillNum, isActive && styles.pillNumActive]}>
          <Text style={styles.pillNumText}>{num}</Text>
        </View>
        <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ────────────────────────────────────────────────────────
  // Composant : Card de section (conteneur blanc arrondi)
  // Reproduit ".section-card" du web
  // ────────────────────────────────────────────────────────
  const SectionCard = ({ iconName, iconLib, iconBg, title, subtitle, children }) => {
    const IconComp = iconLib === 'MaterialCommunity'
      ? MaterialCommunityIcons
      : Ionicons;
    return (
      <View style={styles.sectionCard}>
        {/* En-tête — reproduit ".section-card-header" */}
        <View style={styles.sectionCardHeader}>
          <View style={[styles.sectionCardIcon, { backgroundColor: iconBg || '#EEF2FF' }]}>
            <IconComp name={iconName} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionCardTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.sectionCardSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {children}
      </View>
    );
  };

  // ────────────────────────────────────────────────────────
  // Onglet Documents
  // Reproduit ".doc-list" du web
  // ────────────────────────────────────────────────────────
  const TabDocuments = () => {
    const docs = service.documents || [];

    if (docs.length === 0) {
      return (
        <SectionCard
          iconName="document-text-outline"
          iconBg={COLORS.primary}
          title="Documents requis"
          subtitle="Pièces justificatives à préparer"
        >
          <EmptyState
            iconName="folder-open-outline"
            message="Aucun document spécifié pour ce service."
          />
        </SectionCard>
      );
    }

    return (
      <SectionCard
        iconName="document-text-outline"
        iconBg={COLORS.primary}
        title="Documents requis"
        subtitle="Pièces justificatives à préparer pour votre dossier"
      >
        {docs.map((doc, index) => (
          <View
            key={doc.id}
            style={[
              styles.docItem,
              index < docs.length - 1 && styles.docItemBorder,
            ]}
          >
            {/* Icône obligatoire/optionnel — reproduit ".doc-icon" */}
            <View style={[
              styles.docIconWrap,
              !doc.obligatoire && styles.docIconWrapOptional,
            ]}>
              <Ionicons
                name={doc.obligatoire ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={doc.obligatoire ? '#10b981' : COLORS.gray}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{doc.nom}</Text>
              {/* Badge "facultatif" — reproduit ".badge-optional" */}
              {!doc.obligatoire ? (
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>facultatif</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </SectionCard>
    );
  };

  // ────────────────────────────────────────────────────────
  // Onglet Étapes
  // Reproduit ".steps-grid" du web (grille 2 colonnes)
  // ────────────────────────────────────────────────────────
  const TabEtapes = () => {
    const etapes = service.etapes || [];

    if (etapes.length === 0) {
      return (
        <SectionCard
          iconName="list-outline"
          iconBg="#059669"
          title="Processus complet"
          subtitle="Les étapes pour finaliser votre dossier"
        >
          <EmptyState
            iconName="git-branch-outline"
            message="Aucune étape définie pour ce service."
          />
        </SectionCard>
      );
    }

    return (
      <SectionCard
        iconName="list-outline"
        iconBg="#059669"
        title="Processus complet"
        subtitle="Les étapes pour finaliser votre dossier"
      >
        {/* Grille 2 colonnes — reproduit ".steps-grid" */}
        <View style={styles.stepsGrid}>
          {etapes.map((etape, index) => (
            <View key={etape.id} style={styles.stepCard}>
              {/* Cercle numéroté — reproduit ".step-num" */}
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              <Text style={styles.stepName}>{etape.nom}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    );
  };

  // ────────────────────────────────────────────────────────
  // Onglet Infos Visa
  // Reproduit ".visa-info-grid" du web
  // ────────────────────────────────────────────────────────
  const TabInfosVisa = () => {
    const infos = service.infos_visa;

    if (!infos) {
      return (
        <SectionCard
          iconName="card-outline"
          iconBg="#7c3aed"
          title="Informations Visa"
          subtitle="Délais, frais et coordonnées"
        >
          <EmptyState
            iconName="information-circle-outline"
            message="Aucune information visa disponible."
          />
        </SectionCard>
      );
    }

    // Item d'info — reproduit ".visa-info-item"
    const InfoItem = ({ iconName, iconLib, label, value, accent }) => {
      if (!value) return null;
      const IconComp = iconLib === 'MaterialCommunity'
        ? MaterialCommunityIcons
        : Ionicons;
      return (
        <View style={styles.visaItem}>
          <View style={styles.visaItemIcon}>
            <IconComp name={iconName} size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.visaItemLabel}>{label}</Text>
            <Text style={[styles.visaItemValue, accent && { color: '#f0a500' }]}>
              {value}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <SectionCard
        iconName="card-outline"
        iconBg="#7c3aed"
        title="Informations Visa"
        subtitle="Délais, frais et coordonnées de l'ambassade"
      >
        <View style={styles.visaGrid}>
          <InfoItem
            iconName="time-outline"
            label="Délai de traitement"
            value={infos.delai}
          />
          <InfoItem
            iconName="cash-outline"
            label="Frais visa"
            value={infos.frais ? `${infos.frais} €` : null}
            accent
          />
          <InfoItem
            iconName="business-outline"
            label="Ambassade"
            value={infos.ambassade}
          />
          <InfoItem
            iconName="information-circle-outline"
            label="Notes importantes"
            value={infos.notes}
          />
        </View>
      </SectionCard>
    );
  };

  // ────────────────────────────────────────────────────────
  // Composant : État vide
  // ────────────────────────────────────────────────────────
  const EmptyState = ({ iconName, message }) => (
    <View style={styles.emptyState}>
      <Ionicons name={iconName} size={36} color={COLORS.gray} style={{ opacity: 0.35 }} />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );

  // ────────────────────────────────────────────────────────
  // Sidebar Résumé
  // Reproduit ".sidebar-card" du web (affiché en bas sur mobile)
  // ────────────────────────────────────────────────────────
  const SidebarResume = () => {
    const docs         = service.documents || [];
    const etapes       = service.etapes    || [];
    const obligatoires = docs.filter(d => d.obligatoire).length;

    // Ligne de stat — reproduit ".sidebar-stat"
    const StatRow = ({ iconName, label, value, accent }) => (
      <View style={styles.statRow}>
        <View style={styles.statRowLeft}>
          <Ionicons name={iconName} size={14} color={COLORS.gray} />
          <Text style={styles.statRowLabel}>{label}</Text>
        </View>
        <Text style={[styles.statRowValue, accent && { color: '#f0a500' }]}>
          {value}
        </Text>
      </View>
    );

    return (
      <View style={styles.sidebarCard}>
        {/* En-tête sidebar */}
        <View style={styles.sidebarHeader}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sidebarTitle}>Résumé du service</Text>
        </View>

        <StatRow iconName="location-outline"          label="Destination"       value={service.pays} />
        <StatRow iconName="document-text-outline"     label="Documents requis"  value={String(docs.length)} />
        <StatRow iconName="checkmark-circle-outline"  label="Obligatoires"      value={String(obligatoires)} />
        <StatRow iconName="list-outline"              label="Étapes"            value={String(etapes.length)} />
        {service.infos_visa?.delai ? (
          <StatRow iconName="time-outline" label="Délai estimé" value={service.infos_visa.delai} />
        ) : null}
        {service.infos_visa?.frais ? (
          <StatRow iconName="cash-outline" label="Frais visa" value={`${service.infos_visa.frais} €`} accent />
        ) : null}
      </View>
    );
  };

  // ── Rendu principal ──────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HERO — reproduit ".service-detail-hero" ── */}
      <View style={[styles.hero, { backgroundColor: bgColor }]}>

        {/* Image drapeau en fond */}
        {flagUrl ? (
          <Image
            source={{ uri: flagUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}

        {/* Overlay sombre sur toute la hauteur du hero */}
        <View style={styles.heroOverlay} />

        {/* Contenu du hero par-dessus l'overlay */}
        <View style={styles.heroContent}>

          {/* Bouton retour — reproduit ".back-link" */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={16} color="rgba(255,255,255,0.75)" />
            <Text style={styles.backLinkText}>Retour aux services</Text>
          </TouchableOpacity>

          {/* Pays */}
          <Text style={styles.heroPays}>{service.pays}</Text>

          {/* Nom du service */}
          <Text style={styles.heroTitle}>{service.nom}</Text>

          {/* Description */}
          {service.description ? (
            <Text style={styles.heroDesc}>{service.description}</Text>
          ) : null}

          {/* Pills d'onglets — reproduit ".steps-nav-pills" */}
          <View style={styles.pillsRow}>
            <Pill id="documents" label="Documents" num="1" />
            <Pill id="etapes"    label="Étapes"    num="2" />
            {service.infos_visa ? (
              <Pill id="visa" label="Infos Visa" num="3" />
            ) : null}
          </View>

        </View>
      </View>

      {/* ── CONTENU ── */}
      <View style={styles.content}>

        {activeTab === 'documents' && <TabDocuments />}
        {activeTab === 'etapes'    && <TabEtapes />}
        {activeTab === 'visa'      && <TabInfosVisa />}

        {/* Sidebar résumé — toujours visible, en bas sur mobile */}
        <SidebarResume />

        {/* ── CTA Final — reproduit ".cta-detail" ── */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Prêt à commencer ?</Text>
          <Text style={styles.ctaSubtitle}>
            Notre équipe vous accompagne à chaque étape. Démarrez dès aujourd'hui.
          </Text>

          {/* Bouton principal — reproduit ".btn-cta-white" */}
          <TouchableOpacity
            style={styles.ctaBtnPrimary}
            onPress={() => navigation.navigate('TabDossiers')}
          >
            <Ionicons name="folder-open-outline" size={16} color={COLORS.primary} />
            <Text style={styles.ctaBtnPrimaryText}>Créer mon dossier pour ce service</Text>
          </TouchableOpacity>

          {/* Bouton secondaire — reproduit ".btn-cta-ghost" */}
          <TouchableOpacity
            style={styles.ctaBtnGhost}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={14} color="#fff" />
            <Text style={styles.ctaBtnGhostText}>Tous les services</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

// ============================================================
// STYLES — nommage calqué sur les classes CSS du site web
// ============================================================
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: COLORS.lightGray },

  // ── Hero ─────────────────────────────────────────────────
  hero: {
    minHeight: 260,
    position:  'relative',
  },
  // Overlay sombre sur l'image drapeau
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,21,43,0.62)',  // même teinte sombre que le site
  },
  heroContent: {
    padding:       20,
    paddingTop:    16,
    paddingBottom: 24,
  },

  // Lien retour — reproduit ".back-link"
  backLink: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  16,
  },
  backLinkText: { color: 'rgba(255,255,255,0.72)', fontSize: 13 },

  // Pays
  heroPays: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginBottom: 6 },

  // Titre — reproduit ".hero-service-title"
  heroTitle: {
    fontSize:     24,
    fontWeight:   '800',
    color:        '#fff',
    marginBottom: 10,
    lineHeight:   30,
  },

  // Description — reproduit ".hero-service-lead"
  heroDesc: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.78)',
    lineHeight:   19,
    marginBottom: 18,
  },

  // Pills — reproduit ".steps-nav-pills"
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.2)',
    borderRadius:      999,
    paddingHorizontal: 12,
    paddingVertical:   7,
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderColor:     'rgba(255,255,255,0.55)',
  },
  pillNum: {
    width:           20,
    height:          20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius:    10,
    justifyContent:  'center',
    alignItems:      'center',
  },
  pillNumActive: { backgroundColor: '#f0a500' },
  pillNumText:   { color: '#fff', fontSize: 10, fontWeight: '800' },
  pillLabel:     { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '600' },
  pillLabelActive: { color: '#fff' },

  // ── Contenu ───────────────────────────────────────────────
  content: { padding: 16 },

  // ── SectionCard — reproduit ".section-card" ──────────────
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius:    16,
    padding:         18,
    marginBottom:    16,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  sectionCardHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    marginBottom:      16,
    paddingBottom:     14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#e2e8f0',
  },
  sectionCardIcon: {
    width:           44,
    height:          44,
    borderRadius:    12,
    justifyContent:  'center',
    alignItems:      'center',
  },
  sectionCardTitle:    { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  sectionCardSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // ── Documents — reproduit ".doc-list" ────────────────────
  docItem: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            10,
    paddingVertical: 10,
  },
  docItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docIconWrap: {
    width:           30,
    height:          30,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius:    8,
    justifyContent:  'center',
    alignItems:      'center',
  },
  docIconWrapOptional: { backgroundColor: 'rgba(100,116,139,0.1)' },
  docName:             { fontSize: 14, fontWeight: '500', color: COLORS.darkGray || '#1e293b', marginBottom: 3 },
  optionalBadge: {
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(100,116,139,0.1)',
    borderRadius:      999,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  optionalBadgeText: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },

  // ── Étapes — reproduit ".steps-grid" ─────────────────────
  stepsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  stepCard: {
    width:           '47%',
    backgroundColor: '#eff6ff',
    borderWidth:     1,
    borderColor:     '#bfdbfe',
    borderRadius:    12,
    padding:         14,
    alignItems:      'center',
  },
  stepNum: {
    width:           36,
    height:          36,
    backgroundColor: COLORS.primary,
    borderRadius:    18,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    8,
  },
  stepNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepName:    { fontSize: 12, fontWeight: '700', color: COLORS.primary, textAlign: 'center', lineHeight: 17 },

  // ── Infos Visa — reproduit ".visa-info-item" ─────────────
  visaGrid: { gap: 10 },
  visaItem: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             10,
    backgroundColor: COLORS.lightGray || '#f8fafc',
    borderWidth:     1,
    borderColor:     COLORS.border || '#e2e8f0',
    borderRadius:    10,
    padding:         12,
  },
  visaItemIcon: {
    width:           34,
    height:          34,
    backgroundColor: '#dbeafe',
    borderRadius:    10,
    justifyContent:  'center',
    alignItems:      'center',
  },
  visaItemLabel: {
    fontSize:      10,
    color:         COLORS.gray,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom:  3,
  },
  visaItemValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // ── Sidebar résumé — reproduit ".sidebar-card" ───────────
  sidebarCard: {
    backgroundColor: '#fff',
    borderRadius:    16,
    padding:         18,
    marginBottom:    16,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  14,
  },
  sidebarTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  // Ligne stat — reproduit ".sidebar-stat"
  statRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statRowLabel: { fontSize: 13, color: COLORS.gray },
  statRowValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // ── CTA Final — reproduit ".cta-detail" ──────────────────
  ctaCard: {
    backgroundColor: COLORS.primary,
    borderRadius:    20,
    padding:         24,
    alignItems:      'center',
    marginBottom:    24,
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
  // Bouton principal blanc — reproduit ".btn-cta-white"
  ctaBtnPrimary: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#fff',
    borderRadius:      999,
    paddingHorizontal: 22,
    paddingVertical:   13,
    marginBottom:      10,
    width:             '100%',
    justifyContent:    'center',
  },
  ctaBtnPrimaryText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  // Bouton ghost — reproduit ".btn-cta-ghost"
  ctaBtnGhost: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    borderWidth:       2,
    borderColor:       'rgba(255,255,255,0.4)',
    borderRadius:      999,
    paddingHorizontal: 22,
    paddingVertical:   13,
    width:             '100%',
    justifyContent:    'center',
  },
  ctaBtnGhostText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // ── Empty state ───────────────────────────────────────────
  emptyState:     { alignItems: 'center', paddingVertical: 24 },
  emptyStateText: { color: COLORS.gray, fontSize: 14, textAlign: 'center', marginTop: 8 },
});

export default ServiceDetailScreen;