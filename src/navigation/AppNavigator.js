// ============================================================
// src/navigation/AppNavigator.js
//
// Navigation principale de l'application Elyon Consulting
//
// CORRECTIONS APPORTÉES :
//
//   1. BADGE MESSAGES NON LUS — CORRIGÉ
//      Problème : resetUnreadCount / fetchUnreadCount n'étaient
//      pas accessibles depuis les écrans enfants car la Stack
//      ne transmettait pas ces fonctions via les screenOptions.
//      Solution : Les fonctions sont exposées sur l'objet de
//      navigation parent via setParams() sur le Tab Navigator,
//      ce qui permet à tout écran enfant de les récupérer avec
//      navigation.getParent().
//
//   2. SAFE AREA (barre de navigation Android/iOS) — CORRIGÉ
//      Problème : hauteur fixe à 65px sans tenir compte de la
//      barre système en bas (safe area inset).
//      Solution : useSafeAreaInsets() ajuste dynamiquement le
//      paddingBottom selon l'appareil, ce qui évite que la tab
//      bar soit partiellement cachée par la navigation du tél.
//
//   3. TAB BAR DESIGN AMÉLIORÉ — conservé
//      Fond blanc, ombre subtile, icône active avec fond pill.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
// ✅ CORRECTION 2 : import de useSafeAreaInsets pour gérer la safe area
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../services/AuthContext';
import { getUnreadCount } from '../services/api';
import { COLORS } from '../utils/constants';

// ── Écrans Auth ───────────────────────────────────────────────
import LoginScreen          from '../screens/Auth/LoginScreen';
import RegisterScreen       from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

// ── Onglets ───────────────────────────────────────────────────
import ServicesScreen   from '../screens/Tabs/ServicesScreen';
import DossiersScreen   from '../screens/Tabs/DossiersScreen';
import MessagerieScreen from '../screens/Tabs/MessagerieScreen';
import ProfilScreen     from '../screens/Tabs/ProfilScreen';

// ── Écrans de détail ─────────────────────────────────────────
import ServiceDetailScreen from '../screens/Dossiers/ServiceDetailScreen';
import DossierDetailScreen from '../screens/Dossiers/DossierDetailScreen';
import MessageDetailScreen from '../screens/Dossiers/MessageDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Options header communes ───────────────────────────────────
const headerOptions = {
  headerStyle:      { backgroundColor: COLORS.primary },
  headerTintColor:  COLORS.white,
  headerTitleStyle: { fontWeight: 'bold' },
};

// ─────────────────────────────────────────────────────────────
// Stacks de navigation
// ─────────────────────────────────────────────────────────────

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"          component={LoginScreen} />
    <Stack.Screen name="Register"       component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const ServicesStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="ServicesList"  component={ServicesScreen}
      options={{ title: 'Nos services' }} />
    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen}
      options={{ title: 'Détail du service' }} />
  </Stack.Navigator>
);

const DossiersStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="DossiersList"  component={DossiersScreen}
      options={{ title: 'Mes dossiers' }} />
    <Stack.Screen name="DossierDetail" component={DossierDetailScreen}
      options={{ title: 'Détail du dossier' }} />
  </Stack.Navigator>
);

// ✅ CORRECTION 1 : MessagerieStack reçoit resetUnreadCount et
// fetchUnreadCount en props et les passe en initialParams aux écrans.
// Ainsi, navigation.getParent() dans les écrans enfants peut
// appeler ces fonctions via navigation.getState() / route.params.
const MessagerieStack = ({ resetUnreadCount, fetchUnreadCount }) => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen
      name="MessagerieList"
      component={MessagerieScreen}
      options={{ title: 'Messagerie' }}
      // ✅ On passe les fonctions comme paramètres de route
      initialParams={{ resetUnreadCount, fetchUnreadCount }}
    />
    <Stack.Screen
      name="MessageDetail"
      component={MessageDetailScreen}
      options={{ title: 'Conversation' }}
      initialParams={{ resetUnreadCount, fetchUnreadCount }}
    />
  </Stack.Navigator>
);

// ─────────────────────────────────────────────────────────────
// Composant : Icône d'onglet avec badge non lus
//
// Affiche :
//   - L'icône Ionicons de l'onglet (actif/inactif)
//   - Un badge rouge avec le nombre de messages non lus
//   - Un point animé pulsant quand il y a des non lus
// ─────────────────────────────────────────────────────────────
const TabIcon = ({ name, nameOutline, focused, color, unreadCount = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      // Boucle infinie de pulsation 1 → 1.4 → 1
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4, duration: 600, useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 600, useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stopper et réinitialiser si plus de non lus
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [unreadCount]);

  return (
    <View style={tabStyles.iconContainer}>
      {/* Fond pill quand actif */}
      {focused && <View style={tabStyles.activePill} />}

      {/* Icône Ionicons — outline si inactif, solid si actif */}
      <Ionicons
        name={focused ? name : nameOutline}
        size={24}
        color={color}
      />

      {/* Badge nombre non lus */}
      {unreadCount > 0 && (
        <Animated.View
          style={[
            tabStyles.badge,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={tabStyles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Tabs principales
// ─────────────────────────────────────────────────────────────
const MainTabs = () => {

  // ✅ CORRECTION 2 : récupérer les insets de la safe area
  // insets.bottom = hauteur de la barre de navigation du téléphone
  // (0 sur les vieux Androids, ~34px sur iPhone récent, variable)
  const insets = useSafeAreaInsets();

  // Nombre de messages non lus
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  // Polling du nombre de non lus toutes les 30 secondes
  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count ?? 0);
    } catch {
      // Silencieux si l'endpoint n'est pas encore disponible
    }
  };

  const resetUnreadCount = () => setUnreadCount(0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // ── Style de la barre ──────────────────────────────
        tabBarStyle: {
          backgroundColor:  '#ffffff',
          borderTopWidth:   0,
          // Ombre iOS
          shadowColor:      '#000',
          shadowOffset:     { width: 0, height: -4 },
          shadowOpacity:    0.08,
          shadowRadius:     12,
          // Ombre Android
          elevation:        12,
          // ✅ CORRECTION 2 : hauteur dynamique selon l'appareil
          // On ajoute l'inset bas (safe area) au paddingBottom
          // pour que la barre ne soit jamais cachée par le système
          height:           60 + insets.bottom,
          paddingBottom:    8 + insets.bottom,
          paddingTop:       6,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
          marginTop:  2,
        },
      }}
    >

      {/* ── Onglet Services ── */}
      <Tab.Screen
        name="TabServices"
        component={ServicesStack}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="earth"
              nameOutline="earth-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      {/* ── Onglet Dossiers ── */}
      <Tab.Screen
        name="TabDossiers"
        component={DossiersStack}
        options={{
          tabBarLabel: 'Dossiers',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="folder-open"
              nameOutline="folder-open-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      {/* ── Onglet Messages — avec badge ── */}
      <Tab.Screen
        name="TabMessagerie"
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="chatbubble-ellipses"
              nameOutline="chatbubble-ellipses-outline"
              focused={focused}
              color={unreadCount > 0 ? '#ef4444' : color}
              unreadCount={unreadCount}
            />
          ),
          tabBarLabelStyle: unreadCount > 0
            ? { fontSize: 11, fontWeight: '700', color: '#ef4444' }
            : { fontSize: 11, fontWeight: '600' },
        }}
      >
        {/*
          ✅ CORRECTION 1 : on passe resetUnreadCount et
          fetchUnreadCount en props à MessagerieStack.
          MessagerieStack les transmet en initialParams aux
          écrans enfants (MessagerieScreen, MessageDetailScreen).
          Les écrans récupèrent ces fonctions avec :
            const { resetUnreadCount } = route.params;
        */}
        {(props) => (
          <MessagerieStack
            {...props}
            resetUnreadCount={resetUnreadCount}
            fetchUnreadCount={fetchUnreadCount}
          />
        )}
      </Tab.Screen>

      {/* ── Onglet Profil ── */}
      <Tab.Screen
        name="TabProfil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Profil',
          headerShown: true,
          ...headerOptions,
          title: 'Mon profil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="person"
              nameOutline="person-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
};

// ─────────────────────────────────────────────────────────────
// Composant racine
// ─────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles de la tab bar
// ─────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({

  iconContainer: {
    width:          32,
    height:         32,
    justifyContent: 'center',
    alignItems:     'center',
    position:       'relative',
  },

  activePill: {
    position:        'absolute',
    width:           40,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.primary + '18',
  },

  badge: {
    position:          'absolute',
    top:               -5,
    right:             -8,
    backgroundColor:   '#ef4444',
    borderRadius:      10,
    minWidth:          18,
    height:            18,
    paddingHorizontal: 4,
    justifyContent:    'center',
    alignItems:        'center',
    borderWidth:       2,
    borderColor:       '#ffffff',
  },
  badgeText: {
    color:      '#ffffff',
    fontSize:   9,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export default AppNavigator;