// ============================================================
// src/screens/Tabs/DossiersScreen.js
//
// Onglet "Dossiers" — liste les dossiers du client connecté
//
// Fonctionnement :
//   1. GET /api/dossiers → liste des dossiers
//   2. Bouton "Nouveau" → modal pour choisir un service
//   3. POST /api/dossiers → créer un dossier
//   4. Tap sur un dossier → DossierDetailScreen
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Modal, ScrollView,
} from 'react-native';
import { getDossiers, getServices, createDossier } from '../../services/api';
import { COLORS, STATUS_LABELS } from '../../utils/constants';

const DossiersScreen = ({ navigation }) => {

  const [dossiers,         setDossiers]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [error,            setError]            = useState('');

  // Modal création dossier
  const [showModal,        setShowModal]        = useState(false);
  const [services,         setServices]         = useState([]);
  const [selectedService,  setSelectedService]  = useState(null);
  const [creating,         setCreating]         = useState(false);

  useEffect(() => {
    loadDossiers();
  }, []);

  const loadDossiers = async () => {
    try {
      setError('');
      const response = await getDossiers();
      // L'API retourne { dossiers, total }
      setDossiers(response.data.dossiers);
    } catch {
      setError('Impossible de charger vos dossiers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDossiers();
  }, []);

  // ----------------------------------------------------------
  // Ouvrir le modal — charger la liste des services
  // ----------------------------------------------------------
  const openCreateModal = async () => {
    setSelectedService(null);
    setShowModal(true);
    try {
      const response = await getServices();
      setServices(response.data.services);
    } catch {
      setServices([]);
    }
  };

  // ----------------------------------------------------------
  // Créer un nouveau dossier
  // ----------------------------------------------------------
  const handleCreate = async () => {
    if (!selectedService) return;
    setCreating(true);
    try {
      await createDossier(selectedService.id);
      setShowModal(false);
      await loadDossiers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ----------------------------------------------------------
  // Badge de statut coloré
  // ----------------------------------------------------------
  const StatusBadge = ({ statut }) => (
    <View style={[styles.badge, { backgroundColor: COLORS.status[statut] + '22' }]}>
      <Text style={[styles.badgeText, { color: COLORS.status[statut] }]}>
        {STATUS_LABELS[statut] || statut}
      </Text>
    </View>
  );

  // ----------------------------------------------------------
  // Rendu d'une carte dossier
  // ----------------------------------------------------------
  const renderDossier = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DossierDetail', { dossierId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {item.service?.nom || 'Service inconnu'}
        </Text>
        <StatusBadge statut={item.statut} />
      </View>

      <Text style={styles.pays}>🌍 {item.service?.pays}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.date}>Créé le {item.created_at}</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Chargement de vos dossiers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* En-tête */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Mes dossiers</Text>
          <Text style={styles.pageSubtitle}>{dossiers.length} dossier(s)</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreateModal}>
          <Text style={styles.newButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <FlatList
        data={dossiers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDossier}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
            <Text style={styles.emptyText}>
              Appuyez sur "+ Nouveau" pour créer votre premier dossier.
            </Text>
          </View>
        }
      />

      {/* ---- Modal création dossier ---- */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouveau dossier</Text>
            <Text style={styles.modalSubtitle}>Choisissez le type de visa :</Text>

            <ScrollView style={styles.modalList}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.serviceOption,
                    selectedService?.id === s.id && styles.serviceSelected,
                  ]}
                  onPress={() => setSelectedService(s)}
                >
                  <Text style={[
                    styles.serviceOptionText,
                    selectedService?.id === s.id && styles.serviceSelectedText,
                  ]}>
                    🌍 {s.pays} — {s.nom}
                  </Text>
                  {selectedService?.id === s.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedService || creating) && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={!selectedService || creating}
              >
                {creating
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.confirmText}>Créer le dossier</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.lightGray },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:  { color: COLORS.gray, marginTop: 12 },

  pageHeader:   { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle:    { fontSize: 20, fontWeight: '700', color: COLORS.white },
  pageSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  newButton:    { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  newButtonText:{ color: COLORS.white, fontWeight: '700', fontSize: 13 },

  list: { padding: 16 },

  card:        { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serviceName: { fontSize: 15, fontWeight: '700', color: COLORS.darkGray, flex: 1, marginRight: 8 },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  pays:        { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  date:        { fontSize: 12, color: COLORS.gray },
  arrow:       { color: COLORS.accent, fontWeight: '700' },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle:    { fontSize: 20, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 16 },
  modalList:     { maxHeight: 300, marginBottom: 16 },

  serviceOption:      { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  serviceSelected:    { borderColor: COLORS.accent, backgroundColor: '#fff0f3' },
  serviceOptionText:  { fontSize: 14, color: COLORS.darkGray, flex: 1 },
  serviceSelectedText:{ color: COLORS.accent, fontWeight: '600' },
  checkmark:          { color: COLORS.accent, fontWeight: '700', fontSize: 16 },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelText:   { color: COLORS.gray, fontWeight: '600' },
  confirmBtn:   { flex: 2, backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmText:  { color: COLORS.white, fontWeight: '700' },
  btnDisabled:  { opacity: 0.5 },
});

export default DossiersScreen;