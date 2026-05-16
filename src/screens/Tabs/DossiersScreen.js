// ============================================================
// src/screens/Tabs/DossiersScreen.js
//
// Onglet "Dossiers" — liste les dossiers du client connecté
// Icônes : Ionicons (@expo/vector-icons) — plus d'emojis UI
//
// Fonctionnement :
//   1. GET /api/dossiers  → liste des dossiers
//   2. Bouton "Nouveau"   → modal bottom-sheet choisir un service
//   3. POST /api/dossiers → créer un dossier
//   4. Tap sur un dossier → DossierDetailScreen
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDossiers, getServices, createDossier } from '../../services/api';
import { COLORS, STATUS_LABELS } from '../../utils/constants';

const DossiersScreen = ({ navigation }) => {

  const [dossiers,        setDossiers]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState('');

  // ── État modal création ──────────────────────────────────
  const [showModal,       setShowModal]       = useState(false);
  const [services,        setServices]        = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [creating,        setCreating]        = useState(false);

  useEffect(() => { loadDossiers(); }, []);

  const loadDossiers = async () => {
    try {
      setError('');
      const response = await getDossiers();
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

  // ── Ouvrir le modal et charger les services ──────────────
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

  // ── Créer un dossier ─────────────────────────────────────
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

  // ── Badge statut coloré ──────────────────────────────────
  const StatusBadge = ({ statut }) => (
    <View style={[styles.badge, { backgroundColor: COLORS.status[statut] + '22' }]}>
      <Text style={[styles.badgeText, { color: COLORS.status[statut] }]}>
        {STATUS_LABELS[statut] || statut}
      </Text>
    </View>
  );

  // ── Rendu d'une carte dossier ────────────────────────────
  const renderDossier = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DossierDetail', { dossierId: item.id })}
      activeOpacity={0.8}
    >
      {/* Icône dossier */}
      <View style={styles.cardIcon}>
        <Ionicons name="folder-open-outline" size={22} color={COLORS.primary} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Nom + statut */}
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {item.service?.nom || 'Service inconnu'}
          </Text>
          <StatusBadge statut={item.statut} />
        </View>

        {/* Pays */}
        <View style={styles.paysRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.pays}>{item.service?.pays}</Text>
        </View>

        {/* Date + flèche */}
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
            <Text style={styles.date}>Créé le {item.created_at}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
        </View>
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

      {/* ── En-tête ── */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Mes dossiers</Text>
          <Text style={styles.pageSubtitle}>{dossiers.length} dossier(s)</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreateModal}>
          <Ionicons name="add" size={16} color={COLORS.white} />
          <Text style={styles.newButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* ── Liste ── */}
      <FlatList
        data={dossiers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDossier}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[COLORS.accent]} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
            <Text style={styles.emptyText}>
              Appuyez sur "Nouveau" pour créer votre premier dossier.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreateModal}>
              <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Créer un dossier</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Modal bottom-sheet ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>

            {/* Poignée */}
            <View style={styles.modalHandle} />

            {/* En-tête */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Nouveau dossier</Text>
                <Text style={styles.modalSubtitle}>Choisissez le type de visa</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Liste services */}
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {services.map((s) => {
                const selected = selectedService?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceOption, selected && styles.serviceSelected]}
                    onPress={() => setSelectedService(s)}
                  >
                    <View style={[styles.serviceIcon, selected && styles.serviceIconSelected]}>
                      <Ionicons name="earth-outline" size={18}
                        color={selected ? COLORS.accent : COLORS.gray} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.servicePays, selected && { color: COLORS.accent }]}>
                        {s.pays}
                      </Text>
                      <Text style={[styles.serviceNom, selected && { color: COLORS.accent }]}>
                        {s.nom}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedService || creating) && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={!selectedService || creating}
              >
                {creating ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="folder-open-outline" size={15} color={COLORS.white} />
                    <Text style={styles.confirmText}>Créer le dossier</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.lightGray },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: COLORS.gray, marginTop: 12 },

  pageHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pageTitle:    { fontSize: 20, fontWeight: '700', color: COLORS.white },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  newButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  newButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  list: { padding: 16 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 5,
  },
  serviceName: { fontSize: 15, fontWeight: '700', color: COLORS.darkGray, flex: 1, marginRight: 8 },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  paysRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pays:        { fontSize: 12, color: COLORS.gray },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border || '#e2e8f0', paddingTop: 8,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:    { fontSize: 11, color: COLORS.gray },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray, marginBottom: 8 },
  emptyText:  { color: COLORS.gray, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingTop: 12, maxHeight: '82%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border || '#e2e8f0',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  modalTitle:    { fontSize: 19, fontWeight: '700', color: COLORS.darkGray },
  modalSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.lightGray || '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
  },
  modalList: { maxHeight: 320, marginBottom: 16 },

  serviceOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.border || '#e2e8f0',
    borderRadius: 12, padding: 13, marginBottom: 8,
  },
  serviceSelected:     { borderColor: COLORS.accent, backgroundColor: '#fff8ee' },
  serviceIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.lightGray || '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
  },
  serviceIconSelected: { backgroundColor: '#fff0d6' },
  servicePays: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 2 },
  serviceNom:  { fontSize: 14, color: COLORS.darkGray, fontWeight: '500' },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border || '#e2e8f0',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  cancelText:  { color: COLORS.gray, fontWeight: '600' },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13,
  },
  confirmText: { color: COLORS.white, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
});

export default DossiersScreen;