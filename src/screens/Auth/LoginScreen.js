// ============================================================
// src/screens/Auth/LoginScreen.js
// Design professionnel — cohérent avec elyon-consulting.com
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useAuth } from '../../services/AuthContext';
import { COLORS } from '../../utils/constants';

const LoginScreen = ({ navigation }) => {

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else if (err.response?.status === 403) {
        setError('Votre compte est suspendu. Contactez l\'administrateur.');
      } else {
        setError('Impossible de se connecter. Vérifiez votre connexion.');
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

        {/* ---- En-tête ---- */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>EC</Text>
          </View>
          <Text style={styles.brandName}>ELYON CONSULTING</Text>
          <Text style={styles.brandSub}>Mobilité Internationale</Text>
        </View>

        {/* ---- Carte formulaire ---- */}
        <View style={styles.card}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre espace personnel</Text>

          {/* Erreur */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <View style={styles.inputWrapper}>
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
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mot de passe oublié */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Lien inscription */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Créer un compte gratuit</Text>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2026 Elyon Consulting — Tous droits réservés
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.lightGray,
  },
  scroll: {
    flexGrow:       1,
    justifyContent: 'center',
    padding:        24,
    paddingTop:     48,
  },

  // En-tête
  header: {
    alignItems:   'center',
    marginBottom: 32,
  },
  logoContainer: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: COLORS.primary,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    16,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       8,
  },
  logoText:  { fontSize: 24, fontWeight: '900', color: COLORS.white },
  brandName: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  brandSub:  { fontSize: 13, color: COLORS.gray, marginTop: 4 },

  // Carte
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    20,
    padding:         28,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    12,
    elevation:       4,
  },
  title:    { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },

  // Erreur
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius:    8,
    padding:         12,
    marginBottom:    16,
  },
  errorText: { color: '#DC2626', fontSize: 14 },

  // Champs
  inputGroup:   { marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  inputWrapper: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.lightGray,
    borderWidth:      1.5,
    borderColor:      COLORS.border,
    borderRadius:     12,
    paddingHorizontal:14,
  },
  input: {
    flex:            1,
    paddingVertical: 14,
    fontSize:        15,
    color:           COLORS.darkGray,
  },
  eyeBtn:  { padding: 4 },
  eyeText: { fontSize: 16 },

  // Mot de passe oublié
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { color: COLORS.blue, fontSize: 13, fontWeight: '600' },

  // Bouton principal
  button: {
    backgroundColor: COLORS.primary,
    borderRadius:    12,
    paddingVertical: 16,
    alignItems:      'center',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color:       COLORS.white,
    fontSize:    16,
    fontWeight:  '700',
    letterSpacing: 0.5,
  },

  // Séparateur
  separator: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: 20,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText: { marginHorizontal: 12, color: COLORS.gray, fontSize: 13 },

  // Bouton inscription
  registerButton: {
    borderWidth:     2,
    borderColor:     COLORS.primary,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
  },
  registerButtonText: {
    color:      COLORS.primary,
    fontSize:   15,
    fontWeight: '700',
  },

  // Footer
  footer: {
    textAlign:  'center',
    color:      COLORS.gray,
    fontSize:   11,
    marginTop:  24,
    marginBottom: 8,
  },
});

export default LoginScreen;