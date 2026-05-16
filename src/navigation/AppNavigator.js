// ============================================================
// src/navigation/AppNavigator.js
//
// Navigation principale de l'application Elyon Consulting
//
// NOUVEAUTÉS :
//
//   1. ICÔNES PROFESSIONNELLES — Ionicons sur chaque onglet
//      avec état actif / inactif distinct.
//
//   2. BADGE MESSAGES NON LUS
//      - Polling toutes les 30s via getUnreadCount()
//      - Badge rouge avec chiffre si >= 1 message non lu
//      - Point animé pulsant si >= 1 non lu (attire l'œil)
//      - Disparaît automatiquement quand tout est lu
//
//   3. TAB BAR DESIGN AMÉLIORÉ
//      - Fond blanc propre avec ombre subtile
//      - Icône active avec fond coloré (pill)
//      - Label visible et lisible
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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

const MessagerieStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="MessagerieList" component={MessagerieScreen}
      options={{ title: 'Messagerie' }} />
    <Stack.Screen name="MessageDetail"  component={MessageDetailScreen}
      options={{ title: 'Conversation' }} />
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
  // Animation de pulsation du point rouge
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

      {/* Badge nombre non lus (affichage prioritaire) */}
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

  // Nombre de messages non lus — partagé entre onglet et badge
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  // ── Polling du nombre de non lus toutes les 30 secondes ──
  useEffect(() => {
    fetchUnreadCount();                      // premier appel immédiat
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current); // nettoyage
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count ?? 0);
    } catch {
      // Silencieux : ne pas bloquer l'app si l'endpoint est absent
    }
  };

  // Appelé depuis MessagerieScreen / MessageDetailScreen via
  // navigation.getParent() pour réinitialiser le badge
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
          height:           65,
          paddingBottom:    10,
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
              color={unreadCount > 0 ? '#ef4444' : color} // rouge si non lus
              unreadCount={unreadCount}
            />
          ),
          // Label rouge si non lus
          tabBarLabelStyle: unreadCount > 0
            ? { fontSize: 11, fontWeight: '700', color: '#ef4444' }
            : { fontSize: 11, fontWeight: '600' },
        }}
      >
        {/* Passer resetUnreadCount et fetchUnreadCount en props via
            screenOptions → les écrans peuvent réinitialiser le badge */}
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

  // Conteneur de l'icône (relatif pour le badge)
  iconContainer: {
    width:          32,
    height:         32,
    justifyContent: 'center',
    alignItems:     'center',
    position:       'relative',
  },

  // Fond pill bleu transparent derrière l'icône active
  activePill: {
    position:        'absolute',
    width:           40,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.primary + '18', // 10% opacité
  },

  // Badge rouge — affiché en haut à droite de l'icône
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
    // Bordure blanche pour se détacher de la tab bar
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