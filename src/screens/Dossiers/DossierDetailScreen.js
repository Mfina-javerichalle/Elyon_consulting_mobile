// ============================================================
// src/screens/Dossiers/DossierDetailScreen.js
//
// Détail d'un dossier — 2 onglets : Documents | Étapes
//
// CORRECTION APPORTÉE :
//
//   ÉTAPES NON MISES À JOUR — CORRIGÉ
//   Problème : useEffect([], []) ne chargeait les données
//   qu'une seule fois au montage de l'écran. Si l'admin
//   mettait à jour une étape, le mobile ne le voyait pas
//   car il n'y avait ni re-fetch au focus, ni pull-to-refresh.
//
//   Solution :
//     1. useFocusEffect → recharge à chaque fois que
//        l'utilisateur revient sur cet écran (ex: retour
//        depuis MessageDetail).
//     2. Pull-to-refresh → l'utilisateur peut tirer vers
//        le bas pour forcer le rechargement manuellement.
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
// ✅ CORRECTION : useFocusEffect remplace useEffect
// Il se déclenche à chaque fois que l'écran reprend le focus
import { useFocusEffect } from '@react-navigation/native';
import { getDossier, uploadDocument } from '../../services/api';
import { COLORS, STATUS_LABELS } from '../../utils/constants';

// ── Config visuelle des statuts de document ──────────────────
const DOC_STATUS = {
  non_envoye: { bg: '#f1f5f9', color: '#64748b', label: 'Non envoyé',  icon: 'cloud-upload-outline' },
  en_attente: { bg: '#FFF3CD', color: '#856404', label: 'En attente',  icon: 'time-outline' },
  valide:     { bg: '#D4EDDA', color: '#155724', label: 'Validé',      icon: 'checkmark-circle-outline' },
  refuse:     { bg: '#F8D7DA', color: '#721C24', label: 'Refusé',      icon: 'close-circle-outline' },
};

const DossierDetailScreen = ({ route, navigation }) => {

  const { dossierId } = route.params;

  const [dossier,   setDossier]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  // ✅ CORRECTION 2 : état pour le pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  // ✅ CORRECTION 1 : useFocusEffect au lieu de useEffect
  // → Se déclenche à chaque fois que l'écran redevient visible
  // → Ainsi si l'admin a mis à jour une étape, le client voit
  //   les changements dès qu'il revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      loadDossier();
    }, [dossierId])
  );

  const loadDossier = async (isPullToRefresh = false) => {
    // Ne pas afficher le spinner si c'est un pull-to-refresh
    if (!isPullToRefresh) setLoading(true);
    try {
      const res = await getDossier(dossierId);
      setDossier(res.data.dossier);
      navigation.setOptions({ title: res.data.dossier?.service?.nom || 'Dossier' });
    } catch {
      Alert.alert('Erreur', 'Impossible de charger ce dossier.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ CORRECTION 2 : Pull-to-refresh
  // L'utilisateur tire vers le bas pour forcer le rechargement
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDossier(true);
  }, [dossierId]);

  // ── Upload document via expo-document-picker ─────────────
  const handleUpload = async (documentRequisId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux', 'La taille maximale est de 5 Mo.');
        return;
      }

      setUploading(documentRequisId);
      await uploadDocument(dossierId, documentRequisId, file);
      await loadDossier();
      Alert.alert('Succès', 'Document envoyé avec succès !');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setUploading(null);
    }
  };

  // ── Composant badge statut document ─────────────────────
  const DocBadge = ({ statut }) => {
    const cfg = DOC_STATUS[statut] || DOC_STATUS['non_envoye'];
    return (
      <View style={[styles.docBadge, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
        <Text style={[styles.docBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.gray, marginTop: 12 }}>Chargement...</Text>
      </View>
    );
  }

  if (!dossier) return null;

  const docs       = dossier.documents || [];
  const etapes     = dossier.etapes    || [];
  const validated  = docs.filter(d => d.statut === 'valide').length;
  // ✅ CORRECTION : l'admin utilise "validee" (pas "fait")
  // On accepte les deux valeurs pour compatibilité
  const etapesDone = etapes.filter(e => e.statut === 'validee' || e.statut === 'fait').length;

  return (
    // ✅ CORRECTION 2 : ScrollView avec RefreshControl
    // L'utilisateur peut tirer vers le bas pour recharger
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.accent]}
          tintColor={COLORS.accent}
        />
      }
    >

      {/* ── Hero statut dossier ── */}
      <View style={styles.hero}>
        <Text style={styles.heroService}>{dossier.service?.nom}</Text>

        <View style={styles.heroPaysRow}>
          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.heroPays}>{dossier.service?.pays}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: COLORS.status[dossier.statut] + '33' }]}>
          <Text style={[styles.badgeText, { color: COLORS.status[dossier.statut] }]}>
            {STATUS_LABELS[dossier.statut] || dossier.statut}
          </Text>
        </View>

        <View style={styles.heroDateRow}>
          <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
          <Text style={styles.heroDate}>Créé le {dossier.created_at}</Text>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{validated}/{docs.length}</Text>
            <Text style={styles.heroStatLabel}>Docs validés</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{etapesDone}/{etapes.length}</Text>
            <Text style={styles.heroStatLabel}>Étapes faites</Text>
          </View>
        </View>
      </View>

      {/* ── Onglets ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Ionicons
            name="document-text-outline" size={15}
            color={activeTab === 'documents' ? COLORS.accent : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
            Documents ({docs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'etapes' && styles.tabActive]}
          onPress={() => setActiveTab('etapes')}
        >
          <Ionicons
            name="list-outline" size={15}
            color={activeTab === 'etapes' ? COLORS.accent : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'etapes' && styles.tabTextActive]}>
            Étapes ({etapes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Onglet Documents ── */}
      {activeTab === 'documents' && (
        <View style={styles.section}>
          {docs.length > 0 ? docs.map((doc) => (
            <View key={doc.id} style={styles.docCard}>

              <View style={styles.docHeader}>
                <Text style={styles.docName}>{doc.nom}</Text>
                <View style={doc.obligatoire ? styles.obligBadge : styles.optBadge}>
                  <Text style={doc.obligatoire ? styles.obligText : styles.optText}>
                    {doc.obligatoire ? 'Obligatoire' : 'Optionnel'}
                  </Text>
                </View>
              </View>

              <DocBadge statut={doc.statut} />

              {doc.statut === 'refuse' && doc.commentaire ? (
                <View style={styles.refusBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#856404" />
                  <Text style={styles.refusText}>{doc.commentaire}</Text>
                </View>
              ) : null}

              {doc.statut !== 'valide' && (
                <TouchableOpacity
                  style={[styles.uploadBtn, uploading === doc.id && styles.uploadBtnDisabled]}
                  onPress={() => handleUpload(doc.id)}
                  disabled={uploading !== null}
                >
                  {uploading === doc.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={doc.statut === 'refuse' ? 'refresh-outline' : 'cloud-upload-outline'}
                        size={16} color={COLORS.white}
                      />
                      <Text style={styles.uploadBtnText}>
                        {doc.statut === 'refuse' ? 'Renvoyer le document' : 'Envoyer le document'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {doc.statut === 'valide' && (
                <View style={styles.valideRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#27ae60" />
                  <Text style={styles.valideText}>Document validé par l'administrateur</Text>
                </View>
              )}

            </View>
          )) : (
            <Text style={styles.emptyText}>Aucun document requis pour ce service.</Text>
          )}
        </View>
      )}

      {/* ── Onglet Étapes ── */}
      {activeTab === 'etapes' && (
        <View style={styles.section}>
          {etapes.length > 0 ? (
            etapes
              .sort((a, b) => a.ordre - b.ordre)
              .map((etape, index) => {
                // ✅ CORRECTION : l'admin utilise "validee" (sans accent)
                // "en_cours" s'affiche comme en progression (cercle bleu)
                const fait = etape.statut === 'validee' || etape.statut === 'fait';
                const enCours = etape.statut === 'en_cours';
                return (
                  <View key={etape.id} style={styles.etapeRow}>
                    <View style={[
                      styles.etapeCircle,
                      fait && styles.etapeCircleDone,
                      enCours && styles.etapeCircleEnCours,
                    ]}>
                      {fait ? (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      ) : enCours ? (
                        <Ionicons name="time" size={16} color={COLORS.white} />
                      ) : (
                        <Text style={styles.etapeNum}>{index + 1}</Text>
                      )}
                    </View>

                    {index < etapes.length - 1 && (
                      <View style={[styles.etapeLine, fait && styles.etapeLineDone]} />
                    )}

                    <View style={styles.etapeContent}>
                      <Text style={[styles.etapeName, fait && styles.etapeNameDone]}>
                        {etape.nom}
                      </Text>
                      <View style={styles.etapeStatusRow}>
                        <Ionicons
                          name={fait ? 'checkmark-circle-outline' : enCours ? 'time-outline' : 'time-outline'}
                          size={12}
                          color={fait ? '#27ae60' : enCours ? '#f59e0b' : COLORS.gray}
                        />
                        <Text style={[styles.etapeStatus, {
                          color: fait ? '#27ae60' : enCours ? '#f59e0b' : COLORS.gray
                        }]}>
                          {fait ? 'Complété' : enCours ? 'En cours' : 'En attente'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
          ) : (
            <Text style={styles.emptyText}>Aucune étape définie.</Text>
          )}
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center' },
  heroService: {
    fontSize: 20, fontWeight: '700', color: COLORS.white,
    textAlign: 'center', marginBottom: 8,
  },
  heroPaysRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  heroPays:    { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  badge:       { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  badgeText:   { fontSize: 13, fontWeight: '700' },
  heroDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 16 },
  heroDate:    { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, gap: 24,
  },
  heroStatItem:    { alignItems: 'center' },
  heroStatNum:     { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroStatLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border || '#e2e8f0',
  },
  tab: {
    flex: 1, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText:       { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  tabTextActive: { color: COLORS.accent, fontWeight: '700' },

  section:   { padding: 16 },
  emptyText: { color: COLORS.gray, textAlign: 'center', marginTop: 20, fontSize: 14 },

  docCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  docHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  docName: { fontSize: 15, fontWeight: '600', color: COLORS.darkGray, flex: 1, marginRight: 8 },

  obligBadge: { backgroundColor: '#fdecea', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  obligText:  { fontSize: 11, color: '#e74c3c', fontWeight: '600' },
  optBadge:   { backgroundColor: COLORS.lightGray || '#f8fafc', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  optText:    { fontSize: 11, color: COLORS.gray },

  docBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
  },
  docBadgeText: { fontSize: 12, fontWeight: '600' },

  refusBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#fff8e1', borderRadius: 8, padding: 10,
    marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#f39c12',
  },
  refusText: { fontSize: 13, color: '#856404', flex: 1 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 10,
    paddingVertical: 12, marginTop: 4,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText:     { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  valideRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  valideText: { color: '#27ae60', fontSize: 13, fontWeight: '600' },

  etapeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, position: 'relative' },
  etapeCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.border || '#e2e8f0',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, zIndex: 1,
  },
  etapeCircleDone:    { backgroundColor: '#27ae60' },
  etapeCircleEnCours: { backgroundColor: '#f59e0b' },
  etapeNum:        { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  etapeLine: {
    position: 'absolute', left: 17, top: 36,
    width: 2, height: 24,
    backgroundColor: COLORS.border || '#e2e8f0',
  },
  etapeLineDone: { backgroundColor: '#27ae60' },

  etapeContent:   { flex: 1, paddingTop: 6 },
  etapeName:      { fontSize: 15, fontWeight: '600', color: COLORS.darkGray, marginBottom: 4 },
  etapeNameDone:  { color: '#27ae60' },
  etapeStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etapeStatus:    { fontSize: 12 },
});

export default DossierDetailScreen;