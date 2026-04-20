// ============================================================
// src/screens/Auth/RegisterScreen.js
// Design professionnel — cohérent avec elyon-consulting.com
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { COLORS, TOKEN_KEY, USER_KEY } from '../../utils/constants';

const RegisterScreen = ({ navigation }) => {

  const [form, setForm] = useState({
    name:                  '',
    email:                 '',
    telephone:             '',
    password:              '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const { login } = useAuth();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name = 'Le nom est requis.';
    if (!form.email.trim())      e.email = 'L\'email est requis.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format invalide.';
    if (!form.password)          e.password = 'Le mot de passe est requis.';
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères.';
    if (form.password !== form.password_confirmation)
      e.password_confirmation = 'Les mots de passe ne correspondent pas.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await register(form);
      const { token, user } = response.data;
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      await login(form.email, form.password);
    } catch (err) {
      if (err.response?.status === 422) {
        const laravelErrors = err.response.data.errors || {};
        const mapped = {};
        Object.keys(laravelErrors).forEach(key => {
          mapped[key] = laravelErrors[key][0];
        });
        setErrors(mapped);
      } else {
        setErrors({ general: 'Erreur lors de l\'inscription. Réessayez.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, ...props }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholderTextColor="#9CA3AF"
        value={form[field]}
        onChangeText={(v) => handleChange(field, v)}
        {...props}
      />
      {errors[field] ? <Text style={styles.fieldError}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>EC</Text>
          </View>
          <Text style={styles.brandName}>ELYON CONSULTING</Text>
          <Text style={styles.brandSub}>Mobilité Internationale</Text>
        </View>

        {/* Carte */}
        <View style={styles.card}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Elyon Consulting gratuitement</Text>

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {errors.general}</Text>
            </View>
          ) : null}

          <Field label="Nom complet *"       field="name"      placeholder="Jean Dupont" autoCapitalize="words" />
          <Field label="Adresse e-mail *"    field="email"     placeholder="jean@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Field label="Téléphone (optionnel)" field="telephone" placeholder="+33 6 00 00 00 00" keyboardType="phone-pad" />
          <Field label="Mot de passe *"      field="password"  placeholder="Minimum 8 caractères" secureTextEntry />
          <Field label="Confirmer le mot de passe *" field="password_confirmation" placeholder="Répétez votre mot de passe" secureTextEntry />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 Elyon Consulting — Tous droits réservés</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.lightGray },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48 },
  header:     { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, elevation: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  logoText:  { fontSize: 24, fontWeight: '900', color: COLORS.white },
  brandName: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  brandSub:  { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  title:    { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  errorBox: {
    backgroundColor: '#FEF2F2', borderLeftWidth: 4,
    borderLeftColor: '#EF4444', borderRadius: 8,
    padding: 12, marginBottom: 16,
  },
  errorText:  { color: '#DC2626', fontSize: 14 },
  inputGroup: { marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.lightGray, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: COLORS.darkGray,
  },
  inputError:  { borderColor: '#EF4444' },
  fieldError:  { color: '#DC2626', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8, elevation: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText:     { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  separator:      { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText:  { marginHorizontal: 12, color: COLORS.gray, fontSize: 13 },
  loginButton:    { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  loginButtonText:{ color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  footer:         { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 24, marginBottom: 8 },
});

export default RegisterScreen;