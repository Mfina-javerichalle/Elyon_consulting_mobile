// ============================================================
// src/screens/Dossiers/DossierDetailScreen.js
//
// Écran de détail d'un dossier.
// Affiche 2 onglets : Documents et Étapes
//
// Documents :
//   - Tous les documents requis du service sont affichés
//   - Statuts : non_envoye / en_attente / valide / refuse
//   - Bouton upload pour envoyer ou renvoyer un document
//
// Étapes :
//   - Progression du traitement du dossier
//   - Statut : en_attente / fait
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getDossier, uploadDocument } from '../../services/api';
import { COLORS, STATUS_LABELS } from '../../utils/constants';

const DossierDetailScreen = ({ route, navigation }) => {

  const { dossierId } = route.params;

  const [dossier,   setDossier]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    loadDossier();
  }, []);

  const loadDossier = async () => {
    try {
      const res = await getDossier(dossierId);
      setDossier(res.data.dossier);
      navigation.setOptions({
        title: res.data.dossier?.service?.nom || 'Dossier'
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger ce dossier.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Upload d'un document via expo-document-picker
  // doc.id = ID du document requis (pas du fichier uploadé)
  // ----------------------------------------------------------
  const handleUpload = async (documentRequisId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Vérifier taille max 5 Mo
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux', 'La taille maximale est de 5 Mo.');
        return;
      }

      setUploading(documentRequisId);

      // Appel API : POST /api/dossiers/{id}/documents
      await uploadDocument(dossierId, documentRequisId, file);

      // Recharger pour voir le nouveau statut
      await loadDossier();
      Alert.alert('Succès', 'Document envoyé avec succès !');

    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setUploading(null);
    }
  };

  // ----------------------------------------------------------
  // Badge statut document
  // ----------------------------------------------------------
  const DocBadge = ({ statut }) => {
    const config = {
      non_envoye: { bg: '#f0f0f0', text: '#888888', label: 'Non envoyé' },
      en_attente: { bg: '#FFF3CD', text: '#856404', label: 'En attente' },
      valide:     { bg: '#D4EDDA', text: '#155724', label: 'Validé' },
      refuse:     { bg: '#F8D7DA', text: '#721C24', label: 'Refusé' },
    };
    const c = config[statut] || config['non_envoye'];
    return (
      <View style={[styles.docBadge, { backgroundColor: c.bg }]}>
        <Text style={[styles.docBadgeText, { color: c.text }]}>{c.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!dossier) return null;

  return (
    <ScrollView style={styles.container}>

      {/* ---- Hero : statut du dossier ---- */}
      <View style={styles.hero}>
        <Text style={styles.heroService}>{dossier.service?.nom}</Text>
        <Text style={styles.heroPays}>🌍 {dossier.service?.pays}</Text>
        <View style={[styles.badge, { backgroundColor: COLORS.status[dossier.statut] + '33' }]}>
          <Text style={[styles.badgeText, { color: COLORS.status[dossier.statut] }]}>
            {STATUS_LABELS[dossier.statut] || dossier.statut}
          </Text>
        </View>
        <Text style={styles.heroDate}>Créé le {dossier.created_at}</Text>
      </View>

      {/* ---- Onglets ---- */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
            📄 Documents ({dossier.documents?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'etapes' && styles.tabActive]}
          onPress={() => setActiveTab('etapes')}
        >
          <Text style={[styles.tabText, activeTab === 'etapes' && styles.tabTextActive]}>
            📋 Étapes ({dossier.etapes?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---- Onglet Documents ---- */}
      {activeTab === 'documents' && (
        <View style={styles.section}>
          {dossier.documents && dossier.documents.length > 0 ? (
            dossier.documents.map((doc) => (
              <View key={doc.id} style={styles.docCard}>

                {/* Nom + obligatoire */}
                <View style={styles.docHeader}>
                  <Text style={styles.docName}>{doc.nom}</Text>
                  {doc.obligatoire ? (
                    <View style={styles.obligatoireBadge}>
                      <Text style={styles.obligatoireText}>Obligatoire</Text>
                    </View>
                  ) : (
                    <View style={styles.optionnelBadge}>
                      <Text style={styles.optionnelText}>Optionnel</Text>
                    </View>
                  )}
                </View>

                {/* Statut */}
                <DocBadge statut={doc.statut} />

                {/* Commentaire de refus */}
                {doc.statut === 'refuse' && doc.commentaire ? (
                  <View style={styles.refusBox}>
                    <Text style={styles.refusText}>💬 Raison : {doc.commentaire}</Text>
                  </View>
                ) : null}

                {/* Bouton upload — masqué si déjà validé */}
                {doc.statut !== 'valide' && (
                  <TouchableOpacity
                    style={[
                      styles.uploadBtn,
                      uploading === doc.id && styles.uploadBtnDisabled,
                    ]}
                    onPress={() => handleUpload(doc.id)}
                    disabled={uploading !== null}
                  >
                    {uploading === doc.id ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.uploadBtnText}>
                        {doc.statut === 'refuse' ? '🔄 Renvoyer le document' : '📤 Envoyer le document'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Message si validé */}
                {doc.statut === 'valide' && (
                  <Text style={styles.valideText}>✅ Document validé par l'administrateur</Text>
                )}

              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun document requis pour ce service.</Text>
          )}
        </View>
      )}

      {/* ---- Onglet Étapes ---- */}
      {activeTab === 'etapes' && (
        <View style={styles.section}>
          {dossier.etapes && dossier.etapes.length > 0 ? (
            dossier.etapes
              .sort((a, b) => a.ordre - b.ordre)
              .map((etape, index) => {
                const fait = etape.statut === 'fait';
                return (
                  <View key={etape.id} style={styles.etapeRow}>
                    <View style={[styles.etapeCircle, fait && styles.etapeCircleDone]}>
                      <Text style={styles.etapeCircleText}>
                        {fait ? '✓' : index + 1}
                      </Text>
                    </View>
                    <View style={styles.etapeContent}>
                      <Text style={[styles.etapeName, fait && styles.etapeNameDone]}>
                        {etape.nom}
                      </Text>
                      <Text style={[
                        styles.etapeStatus,
                        { color: fait ? '#27ae60' : COLORS.gray }
                      ]}>
                        {fait ? 'Complété' : 'En attente'}
                      </Text>
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

  // Hero
  hero:        { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center' },
  heroService: { fontSize: 20, fontWeight: '700', color: COLORS.white, textAlign: 'center', marginBottom: 6 },
  heroPays:    { fontSize: 14, color: COLORS.gray, marginBottom: 12 },
  heroDate:    { fontSize: 12, color: COLORS.gray, marginTop: 8 },
  badge:       { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  badgeText:   { fontSize: 13, fontWeight: '700' },

  // Onglets
  tabs:          { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:           { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText:       { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  tabTextActive: { color: COLORS.accent, fontWeight: '700' },

  section:   { padding: 16 },
  emptyText: { color: COLORS.gray, textAlign: 'center', marginTop: 20, fontSize: 14 },

  // Carte document
  docCard:   { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  docName:   { fontSize: 15, fontWeight: '600', color: COLORS.darkGray, flex: 1, marginRight: 8 },

  obligatoireBadge: { backgroundColor: '#fdecea', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  obligatoireText:  { fontSize: 11, color: '#e74c3c', fontWeight: '600' },
  optionnelBadge:   { backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  optionnelText:    { fontSize: 11, color: COLORS.gray },

  docBadge:     { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  docBadgeText: { fontSize: 12, fontWeight: '600' },

  refusBox:  { backgroundColor: '#fff8e1', borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#f39c12' },
  refusText: { fontSize: 13, color: '#856404' },

  uploadBtn:         { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText:     { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  valideText:        { color: '#27ae60', fontSize: 13, fontWeight: '600', marginTop: 4 },

  // Étapes
  etapeRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  etapeCircle:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#cccccc', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  etapeCircleDone: { backgroundColor: '#27ae60' },
  etapeCircleText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  etapeContent:    { flex: 1, paddingTop: 6 },
  etapeName:       { fontSize: 15, fontWeight: '600', color: COLORS.darkGray },
  etapeNameDone:   { color: '#27ae60' },
  etapeStatus:     { fontSize: 12, marginTop: 2 },
});

export default DossierDetailScreen;