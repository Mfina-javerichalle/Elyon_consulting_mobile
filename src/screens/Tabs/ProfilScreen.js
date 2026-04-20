// ============================================================
// src/screens/Tabs/ProfilScreen.js
// Design professionnel — cohérent avec elyon-consulting.com
// Fonctionnalités :
//   - Affichage du profil avec avatar
//   - Modification du profil (nom, email, téléphone)
//   - Changement de mot de passe
//   - Modification de l'avatar
//   - Suppression du compte
//   - Déconnexion
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../services/AuthContext';
import { changePassword, updateProfile, deleteAccount } from '../../services/api';
import api from '../../services/api';
import { COLORS } from '../../utils/constants';

const ProfilScreen = () => {

  const { user, logout, updateUser } = useAuth();

  // ---- États des formulaires ----
  const [activeForm,    setActiveForm]    = useState(null); // 'profile' | 'password' | 'delete'
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Formulaire modification profil
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

  // Formulaire suppression compte
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [deleteError,    setDeleteError]    = useState('');

  // ----------------------------------------------------------
  // Ouvrir/Fermer un formulaire
  // ----------------------------------------------------------
  const toggleForm = (form) => {
    setActiveForm(activeForm === form ? null : form);
    setProfileError(''); setProfileSuccess('');
    setPwError('');      setPwSuccess('');
    setDeleteError('');
  };

  // ----------------------------------------------------------
  // Déconnexion
  // ----------------------------------------------------------
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  // ----------------------------------------------------------
  // Changer l'avatar
  // ----------------------------------------------------------
  const handleChangeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Autorisez l\'accès à votre galerie dans les paramètres.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:        [1, 1],
        quality:       0.8,
      });

      if (result.canceled) return;

      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', {
        uri:  result.assets[0].uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
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

  // ----------------------------------------------------------
  // Modifier le profil
  // ----------------------------------------------------------
  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError('Le nom et l\'email sont obligatoires.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      setProfileError('Format d\'email invalide.');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

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

  // ----------------------------------------------------------
  // Changer le mot de passe
  // ----------------------------------------------------------
  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.password || !pwForm.password_confirmation) {
      setPwError('Tous les champs sont obligatoires.');
      return;
    }
    if (pwForm.password.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwLoading(true);
    setPwError('');
    setPwSuccess('');

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

  // ----------------------------------------------------------
  // Supprimer le compte
  // ----------------------------------------------------------
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Tous vos dossiers et documents seront supprimés définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Veuillez saisir votre mot de passe pour confirmer.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword);
      // Nettoyer et déconnecter
      await logout();
    } catch (err) {
      if (err.response?.status === 401) {
        setDeleteError('Mot de passe incorrect.');
      } else {
        setDeleteError(err.response?.data?.message || 'Erreur lors de la suppression.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Initiales pour l'avatar par défaut
  const initiales = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >

      {/* ---- Carte profil ---- */}
      <View style={styles.profileCard}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleChangeAvatar}
          disabled={avatarLoading}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initiales}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            {avatarLoading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.cameraIcon}>📷</Text>
            }
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.telephone ? <Text style={styles.phone}>📞 {user.telephone}</Text> : null}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? 'Administrateur' : 'Client'}
          </Text>
        </View>
        <Text style={styles.avatarHint}>Appuyez sur la photo pour la modifier</Text>
      </View>

      {/* ---- Messages de succès globaux ---- */}
      {profileSuccess ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ {profileSuccess}</Text>
        </View>
      ) : null}
      {pwSuccess ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ {pwSuccess}</Text>
        </View>
      ) : null}

      {/* ---- Modifier le profil ---- */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleForm('profile')}
        >
          <View>
            <Text style={styles.sectionTitle}>Modifier le profil</Text>
            <Text style={styles.sectionSub}>Nom, email, téléphone</Text>
          </View>
          <Text style={styles.chevron}>{activeForm === 'profile' ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {activeForm === 'profile' && (
          <View style={styles.formBody}>
            {profileError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {profileError}</Text>
              </View>
            ) : null}

            {[
              { label: 'Nom complet',   field: 'name',      keyboard: 'default',       cap: 'words' },
              { label: 'Adresse email', field: 'email',     keyboard: 'email-address', cap: 'none'  },
              { label: 'Téléphone',     field: 'telephone', keyboard: 'phone-pad',     cap: 'none'  },
            ].map(({ label, field, keyboard, cap }) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={profileForm[field]}
                  onChangeText={(v) => setProfileForm(prev => ({ ...prev, [field]: v }))}
                  keyboardType={keyboard}
                  autoCapitalize={cap}
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ))}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => toggleForm('profile')}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, profileLoading && { opacity: 0.7 }]}
                onPress={handleUpdateProfile}
                disabled={profileLoading}
              >
                {profileLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveBtnText}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ---- Changer le mot de passe ---- */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleForm('password')}
        >
          <View>
            <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
            <Text style={styles.sectionSub}>Modifier votre mot de passe actuel</Text>
          </View>
          <Text style={styles.chevron}>{activeForm === 'password' ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {activeForm === 'password' && (
          <View style={styles.formBody}>
            {pwError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {pwError}</Text>
              </View>
            ) : null}

            {[
              { label: 'Mot de passe actuel',               field: 'current_password' },
              { label: 'Nouveau mot de passe',              field: 'password' },
              { label: 'Confirmer le nouveau mot de passe', field: 'password_confirmation' },
            ].map(({ label, field }) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={pwForm[field]}
                  onChangeText={(v) => setPwForm(prev => ({ ...prev, [field]: v }))}
                />
              </View>
            ))}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => toggleForm('password')}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, pwLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={pwLoading}
              >
                {pwLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveBtnText}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ---- Supprimer le compte ---- */}
      <View style={[styles.section, styles.dangerSection]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleForm('delete')}
        >
          <View>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Supprimer le compte</Text>
            <Text style={styles.sectionSub}>Action irréversible</Text>
          </View>
          <Text style={styles.chevron}>{activeForm === 'delete' ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {activeForm === 'delete' && (
          <View style={styles.formBody}>
            <View style={styles.dangerWarning}>
              <Text style={styles.dangerWarningText}>
                ⚠ Cette action supprimera définitivement votre compte, tous vos dossiers et documents. Elle est irréversible.
              </Text>
            </View>

            {deleteError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmez votre mot de passe</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteBtn, deleteLoading && { opacity: 0.7 }]}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={styles.deleteBtnText}>Supprimer définitivement mon compte</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ---- Déconnexion ---- */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 Elyon Consulting</Text>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  scroll:    { padding: 20, paddingBottom: 40 },

  // Carte profil
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius:    20,
    padding:         28,
    alignItems:      'center',
    marginBottom:    16,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    12,
    elevation:       8,
  },
  avatarContainer:  { position: 'relative', marginBottom: 16 },
  avatarImage:      { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder:{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  avatarText:       { fontSize: 30, fontWeight: '800', color: COLORS.white },
  cameraBtn:        { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary, borderWidth: 2, borderColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  cameraIcon:       { fontSize: 14 },
  avatarHint:       { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  name:             { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email:            { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  phone:            { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  roleBadge:        { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  roleText:         { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // Messages succès
  successBox: { backgroundColor: '#F0FDF4', borderLeftWidth: 4, borderLeftColor: '#22C55E', borderRadius: 8, padding: 12, marginBottom: 12 },
  successText:{ color: '#16A34A', fontSize: 13 },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    marginBottom:    12,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    4,
    elevation:       2,
  },
  dangerSection:    { borderWidth: 1, borderColor: '#FEE2E2' },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  dangerTitle:      { color: '#DC2626' },
  sectionSub:       { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  chevron:          { color: COLORS.gray },

  // Formulaires
  formBody:   { paddingHorizontal: 16, paddingBottom: 16 },
  errorBox:   { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#EF4444', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:  { color: '#DC2626', fontSize: 13 },
  inputGroup: { marginBottom: 12 },
  label:      { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  input:      { backgroundColor: COLORS.lightGray, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.darkGray },

  // Actions formulaire
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText:{ color: COLORS.gray, fontWeight: '600' },
  saveBtn:     { flex: 2, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },

  // Danger
  dangerWarning:     { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, marginBottom: 12 },
  dangerWarningText: { color: '#DC2626', fontSize: 13, lineHeight: 19 },
  deleteBtn:         { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  deleteBtnText:     { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Déconnexion
  logoutButton: { borderWidth: 2, borderColor: '#EF4444', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, backgroundColor: COLORS.white },
  logoutText:   { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  footer:       { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 8 },
});

export default ProfilScreen;