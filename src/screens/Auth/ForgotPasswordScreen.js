// ============================================================
// src/screens/Auth/ForgotPasswordScreen.js
// Design professionnel — cohérent avec elyon-consulting.com
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { forgotPassword } from '../../services/api';
import { COLORS } from '../../utils/constants';

const ForgotPasswordScreen = ({ navigation }) => {

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse e-mail.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Format d\'email invalide.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Aucun compte trouvé avec cette adresse e-mail.');
      } else {
        setError('Erreur lors de l\'envoi. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

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

        <View style={styles.card}>

          {/* ---- Confirmation après envoi ---- */}
          {sent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successText}>
                Un lien de réinitialisation a été envoyé à{' '}
                <Text style={styles.emailHighlight}>{email}</Text>.{'\n\n'}
                Consultez votre boîte mail et suivez les instructions.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>

          ) : (

            /* ---- Formulaire ---- */
            <>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Saisissez votre e-mail pour recevoir un lien de réinitialisation.
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse e-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.buttonText}>Envoyer le lien</Text>
                }
              </TouchableOpacity>

              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backButtonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        <Text style={styles.footer}>© 2026 Elyon Consulting — Tous droits réservés</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48 },

  header:    { alignItems: 'center', marginBottom: 32 },
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
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24, lineHeight: 20 },

  errorBox: {
    backgroundColor: '#FEF2F2', borderLeftWidth: 4,
    borderLeftColor: '#EF4444', borderRadius: 8,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 14 },

  inputGroup: { marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.lightGray, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: COLORS.darkGray,
  },

  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', elevation: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText:     { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  separator:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText: { marginHorizontal: 12, color: COLORS.gray, fontSize: 13 },

  backButton:     { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },

  // Confirmation
  successContainer: { alignItems: 'center', paddingVertical: 10 },
  successIcon:      { fontSize: 56, marginBottom: 16 },
  successTitle:     { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  successText:      { color: COLORS.gray, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  emailHighlight:   { color: COLORS.primary, fontWeight: '700' },

  footer: { textAlign: 'center', color: COLORS.gray, fontSize: 11, marginTop: 24, marginBottom: 8 },
});

export default ForgotPasswordScreen;