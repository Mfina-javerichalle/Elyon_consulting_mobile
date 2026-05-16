// ============================================================
// src/screens/Tabs/ProfilScreen.js
//
// Écran profil utilisateur
// Icônes : Ionicons (@expo/vector-icons) — plus d'emojis UI
//
// Fonctionnalités :
//   - Affichage du profil avec avatar + initiales
//   - Modification du profil (nom, email, téléphone)
//   - Changement de mot de passe
//   - Modification de l'avatar (galerie)
//   - Suppression du compte
//   - Déconnexion
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../services/AuthContext';
import { changePassword, updateProfile, deleteAccount } from '../../services/api';
import api from '../../services/api';
import { COLORS } from '../../utils/constants';

const ProfilScreen = () => {

  const { user, logout, updateUser } = useAuth();

  // ── Formulaire actif ─────────────────────────────────────
  const [activeForm,    setActiveForm]    = useState(null); // 'profile' | 'password' | 'delete'
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Formulaire profil
  const [profileForm, setProfileForm] = useState({
    name:      user?.name      || '',
    email:     user?.email     || '',
    telephone: user?.telephone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError,   setProfileError]   = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Formulaire mot de passe
  const [pwForm, setPwForm] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Formulaire suppression
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [deleteError,    setDeleteError]    = useState('');

  // ── Ouvrir/Fermer un formulaire ──────────────────────────
  const toggleForm = (form) => {
    setActiveForm(activeForm === form ? null : form);
    setProfileError(''); setProfileSuccess('');
    setPwError('');      setPwSuccess('');
    setDeleteError('');
  };

  // ── Déconnexion ──────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  // ── Changer l'avatar ─────────────────────────────────────
  const handleChangeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Autorisez l\'accès à votre galerie dans les paramètres.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled) return;

      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', {
        uri: result.assets[0].uri, name: 'avatar.jpg', type: 'image/jpeg',
      });
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateUser({ ...user, avatar: response.data.avatar });
      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Modifier le profil ───────────────────────────────────
  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError('Le nom et l\'email sont obligatoires.'); return;
    }
    if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      setProfileError('Format d\'email invalide.'); return;
    }
    setProfileLoading(true); setProfileError(''); setProfileSuccess('');
    try {
      const response = await updateProfile(profileForm);
      await updateUser({ ...user, ...response.data.user });
      setProfileSuccess('Profil mis à jour avec succès !');
      setActiveForm(null);
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors;
        setProfileError(Object.values(errs)[0]?.[0] || 'Erreur de validation.');
      } else {
        setProfileError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Changer le mot de passe ──────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.password || !pwForm.password_confirmation) {
      setPwError('Tous les champs sont obligatoires.'); return;
    }
    if (pwForm.password.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return;
    }
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwError('Les mots de passe ne correspondent pas.'); return;
    }
    setPwLoading(true); setPwError(''); setPwSuccess('');
    try {
      await changePassword(pwForm);
      setPwSuccess('Mot de passe modifié avec succès !');
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setActiveForm(null);
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors;
        setPwError(Object.values(errs)[0]?.[0] || 'Erreur de validation.');
      } else {
        setPwError(err.response?.data?.message || 'Mot de passe actuel incorrect.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ── Supprimer le compte ──────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Tous vos dossiers et documents seront supprimés définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Veuillez saisir votre mot de passe pour confirmer.'); return;
    }
    setDeleteLoading(true); setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      await logout();
    } catch (err) {
      setDeleteError(
        err.response?.status === 401
          ? 'Mot de passe incorrect.'
          : err.response?.data?.message || 'Erreur lors de la suppression.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Initiales avatar par défaut
  const initiales = user?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // ────────────────────────────────────────────────────────
  // Composant : Section accordéon réutilisable
  // ────────────────────────────────────────────────────────
  const Section = ({ id, iconName, iconBg, title, subtitle, danger, children }) => {
    const isOpen = activeForm === id;
    return (
      <View style={[styles.section, danger && styles.dangerSection]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleForm(id)}>
          {/* Icône de section */}
          <View style={[styles.sectionIconWrap, { backgroundColor: iconBg || '#EEF2FF' }]}>
            <Ionicons name={iconName} size={18} color={danger ? '#DC2626' : COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, danger && styles.dangerTitle]}>{title}</Text>
            <Text style={styles.sectionSub}>{subtitle}</Text>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16} color={COLORS.gray}
          />
        </TouchableOpacity>
        {isOpen && <View style={styles.formBody}>{children}</View>}
      </View>
    );
  };

  // ────────────────────────────────────────────────────────
  // Composant : Champ texte réutilisable
  // ────────────────────────────────────────────────────────
  const InputField = ({ label, value, onChangeText, keyboard, cap, secure, placeholder }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard || 'default'}
        autoCapitalize={cap || 'sentences'}
        autoCorrect={false}
        secureTextEntry={secure}
        placeholder={placeholder || ''}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}>

      {/* ── Carte profil ── */}
      <View style={styles.profileCard}>
        {/* Avatar cliquable */}
        <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}
          disabled={avatarLoading}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitiales}>{initiales}</Text>
            </View>
          )}
          {/* Bouton caméra */}
          <View style={styles.cameraBtn}>
            {avatarLoading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Ionicons name="camera" size={14} color={COLORS.white} />
            }
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.telephone ? (
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.phone}>{user.telephone}</Text>
          </View>
        ) : null}

        <View style={styles.roleBadge}>
          <Ionicons
            name={user?.role === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
            size={13} color={COLORS.white}
          />
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? 'Administrateur' : 'Client'}
          </Text>
        </View>
        <Text style={styles.avatarHint}>Appuyez sur la photo pour la modifier</Text>
      </View>

      {/* Messages de succès globaux */}
      {profileSuccess ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
          <Text style={styles.successText}>{profileSuccess}</Text>
        </View>
      ) : null}
      {pwSuccess ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
          <Text style={styles.successText}>{pwSuccess}</Text>
        </View>
      ) : null}

      {/* ── Section : Modifier le profil ── */}
      <Section
        id="profile"
        iconName="person-outline"
        iconBg="#EEF2FF"
        title="Modifier le profil"
        subtitle="Nom, email, téléphone"
      >
        {profileError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        ) : null}

        <InputField label="Nom complet" value={profileForm.name}
          onChangeText={(v) => setProfileForm(p => ({ ...p, name: v }))}
          keyboard="default" cap="words" />
        <InputField label="Adresse email" value={profileForm.email}
          onChangeText={(v) => setProfileForm(p => ({ ...p, email: v }))}
          keyboard="email-address" cap="none" />
        <InputField label="Téléphone" value={profileForm.telephone}
          onChangeText={(v) => setProfileForm(p => ({ ...p, telephone: v }))}
          keyboard="phone-pad" cap="none" />

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => toggleForm('profile')}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, profileLoading && { opacity: 0.7 }]}
            onPress={handleUpdateProfile} disabled={profileLoading}>
            {profileLoading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.saveBtnText}>Enregistrer</Text>
            }
          </TouchableOpacity>
        </View>
      </Section>

      {/* ── Section : Changer le mot de passe ── */}
      <Section
        id="password"
        iconName="lock-closed-outline"
        iconBg="#EEF2FF"
        title="Changer le mot de passe"
        subtitle="Modifier votre mot de passe actuel"
      >
        {pwError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{pwError}</Text>
          </View>
        ) : null}

        {[
          { label: 'Mot de passe actuel',               field: 'current_password' },
          { label: 'Nouveau mot de passe',              field: 'password' },
          { label: 'Confirmer le nouveau mot de passe', field: 'password_confirmation' },
        ].map(({ label, field }) => (
          <InputField key={field} label={label}
            value={pwForm[field]}
            onChangeText={(v) => setPwForm(p => ({ ...p, [field]: v }))}
            secure placeholder="••••••••" />
        ))}

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => toggleForm('password')}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, pwLoading && { opacity: 0.7 }]}
            onPress={handleChangePassword} disabled={pwLoading}>
            {pwLoading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.saveBtnText}>Enregistrer</Text>
            }
          </TouchableOpacity>
        </View>
      </Section>

      {/* ── Section : Supprimer le compte ── */}
      <Section
        id="delete"
        iconName="trash-outline"
        iconBg="#FEE2E2"
        title="Supprimer le compte"
        subtitle="Action irréversible"
        danger
      >
        <View style={styles.dangerWarning}>
          <Ionicons name="warning-outline" size={16} color="#DC2626" />
          <Text style={styles.dangerWarningText}>
            Cette action supprimera définitivement votre compte, tous vos dossiers et documents. Elle est irréversible.
          </Text>
        </View>

        {deleteError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{deleteError}</Text>
          </View>
        ) : null}

        <InputField label="Confirmez votre mot de passe"
          value={deletePassword} onChangeText={setDeletePassword}
          secure placeholder="••••••••" />

        <TouchableOpacity
          style={[styles.deleteBtn, deleteLoading && { opacity: 0.7 }]}
          onPress={handleDeleteAccount} disabled={deleteLoading}>
          {deleteLoading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : (
              <>
                <Ionicons name="trash-outline" size={16} color={COLORS.white} />
                <Text style={styles.deleteBtnText}>Supprimer définitivement mon compte</Text>
              </>
            )
          }
        </TouchableOpacity>
      </Section>

      {/* ── Déconnexion ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 Elyon Consulting</Text>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  scroll:    { padding: 20, paddingBottom: 40 },

  // ── Carte profil ──────────────────────────────────────────
  profileCard: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    padding: 28, alignItems: 'center', marginBottom: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarContainer:   { position: 'relative', marginBottom: 16 },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitiales: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.accent,
    borderWidth: 2, borderColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarHint: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 8 },
  name:  { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  phone:    { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginTop: 8,
  },
  roleText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // ── Messages succès ───────────────────────────────────────
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderLeftWidth: 4, borderLeftColor: '#22C55E',
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  successText: { color: '#16A34A', fontSize: 13, flex: 1 },

  // ── Section accordéon ─────────────────────────────────────
  section: {
    backgroundColor: COLORS.white, borderRadius: 16,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dangerSection: { borderWidth: 1, borderColor: '#FEE2E2' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  dangerTitle:   { color: '#DC2626' },
  sectionSub:    { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // ── Formulaires ───────────────────────────────────────────
  formBody:   { paddingHorizontal: 16, paddingBottom: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#EF4444',
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  errorText:  { color: '#DC2626', fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 12 },
  label:      { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.lightGray || '#f8fafc',
    borderWidth: 1.5, borderColor: COLORS.border || '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.darkGray,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border || '#e2e8f0',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.gray, fontWeight: '600' },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },

  // ── Zone danger ───────────────────────────────────────────
  dangerWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, marginBottom: 12,
  },
  dangerWarningText: { color: '#DC2626', fontSize: 13, lineHeight: 19, flex: 1 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', borderRadius: 10,
    paddingVertical: 14, marginTop: 4,
  },
  deleteBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // ── Déconnexion ───────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderColor: '#EF4444', borderRadius: 16,
    padding: 16, marginBottom: 12, backgroundColor: COLORS.white,
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  footer:     { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 8 },
});

export default ProfilScreen;