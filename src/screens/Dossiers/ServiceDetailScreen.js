// ============================================================
// src/screens/Dossiers/ServiceDetailScreen.js
//
// Écran de détail d'un service.
// Affiche : infos visa, documents requis, étapes du traitement
// Les données sont passées directement depuis ServicesScreen
// via navigation.navigate('ServiceDetail', { service: item })
// ============================================================

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const ServiceDetailScreen = ({ route, navigation }) => {

  // Récupérer le service passé depuis ServicesScreen
  const { service } = route.params;

  return (
    <ScrollView style={styles.container}>

      {/* ---- Hero ---- */}
      <View style={styles.hero}>
        <Text style={styles.pays}>🌍 {service.pays}</Text>
        <Text style={styles.nom}>{service.nom}</Text>
        {service.description ? (
          <Text style={styles.description}>{service.description}</Text>
        ) : null}
      </View>

      {/* ---- Infos visa ---- */}
      {service.infos_visa ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations visa</Text>
          {service.infos_visa.delai ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Délai de traitement</Text>
              <Text style={styles.infoValue}>{service.infos_visa.delai}</Text>
            </View>
          ) : null}
          {service.infos_visa.frais ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Frais</Text>
              <Text style={styles.infoValue}>{service.infos_visa.frais} €</Text>
            </View>
          ) : null}
          {service.infos_visa.ambassade ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ambassade</Text>
              <Text style={styles.infoValue}>{service.infos_visa.ambassade}</Text>
            </View>
          ) : null}
          {service.infos_visa.notes ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{service.infos_visa.notes}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ---- Documents requis ---- */}
      {service.documents && service.documents.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Documents requis</Text>
          {service.documents.map((doc) => (
            <View key={doc.id} style={styles.listItem}>
              <Text style={styles.bullet}>
                {doc.obligatoire ? '•' : '◦'}
              </Text>
              <View style={styles.listContent}>
                <Text style={styles.listText}>{doc.nom}</Text>
                {!doc.obligatoire ? (
                  <Text style={styles.optionnel}>(optionnel)</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ---- Étapes ---- */}
      {service.etapes && service.etapes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Étapes du traitement</Text>
          {service.etapes.map((etape, index) => (
            <View key={etape.id} style={styles.etapeRow}>
              <View style={styles.etapeNum}>
                <Text style={styles.etapeNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.etapeNom}>{etape.nom}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ---- Bouton créer un dossier ---- */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('TabDossiers')}
        >
          <Text style={styles.ctaText}>📁 Créer un dossier pour ce service</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.lightGray },
  hero:         { backgroundColor: COLORS.primary, padding: 24 },
  pays:         { fontSize: 14, color: COLORS.gray, marginBottom: 6 },
  nom:          { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 10 },
  description:  { fontSize: 14, color: '#aaaaaa', lineHeight: 20 },

  section:      { backgroundColor: COLORS.white, margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray, marginBottom: 14 },

  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel:  { fontSize: 13, color: COLORS.gray, flex: 1 },
  infoValue:  { fontSize: 13, color: COLORS.darkGray, fontWeight: '600', flex: 1, textAlign: 'right' },

  listItem:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet:     { fontSize: 18, color: COLORS.accent, marginRight: 10, lineHeight: 22 },
  listContent:{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  listText:   { fontSize: 14, color: COLORS.darkGray },
  optionnel:  { fontSize: 12, color: COLORS.gray, marginLeft: 6 },

  etapeRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  etapeNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  etapeNumText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  etapeNom:     { fontSize: 14, color: COLORS.darkGray, flex: 1 },

  ctaContainer: { padding: 16, paddingTop: 20, paddingBottom: 32 },
  ctaButton:    { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  ctaText:      { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default ServiceDetailScreen;