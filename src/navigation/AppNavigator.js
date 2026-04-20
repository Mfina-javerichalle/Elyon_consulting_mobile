import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../services/AuthContext';
import { COLORS } from '../utils/constants';

import LoginScreen          from '../screens/Auth/LoginScreen';
import RegisterScreen       from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

import ServicesScreen   from '../screens/Tabs/ServicesScreen';
import DossiersScreen   from '../screens/Tabs/DossiersScreen';
import MessagerieScreen from '../screens/Tabs/MessagerieScreen';
import ProfilScreen     from '../screens/Tabs/ProfilScreen';

import ServiceDetailScreen from '../screens/Dossiers/ServiceDetailScreen';
import DossierDetailScreen from '../screens/Dossiers/DossierDetailScreen';
import MessageDetailScreen from '../screens/Dossiers/MessageDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const headerOptions = {
  headerStyle:      { backgroundColor: COLORS.primary },
  headerTintColor:  COLORS.white,
  headerTitleStyle: { fontWeight: 'bold' },
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"          component={LoginScreen} />
    <Stack.Screen name="Register"       component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const ServicesStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="ServicesList"  component={ServicesScreen}      options={{ title: 'Nos services' }} />
    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Detail du service' }} />
  </Stack.Navigator>
);

const DossiersStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="DossiersList"  component={DossiersScreen}      options={{ title: 'Mes dossiers' }} />
    <Stack.Screen name="DossierDetail" component={DossierDetailScreen} options={{ title: 'Detail du dossier' }} />
  </Stack.Navigator>
);

const MessagerieStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="MessagerieList" component={MessagerieScreen}   options={{ title: 'Messagerie' }} />
    <Stack.Screen name="MessageDetail"  component={MessageDetailScreen} options={{ title: 'Conversation' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown:             false,
      tabBarStyle:             { backgroundColor: COLORS.primary, borderTopColor: COLORS.secondary, borderTopWidth: 1, height: 60, paddingBottom: 8 },
      tabBarActiveTintColor:   COLORS.accent,
      tabBarInactiveTintColor: '#888888',
      tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="TabServices"    component={ServicesStack}   options={{ tabBarLabel: 'Services' }} />
    <Tab.Screen name="TabDossiers"    component={DossiersStack}   options={{ tabBarLabel: 'Dossiers' }} />
    <Tab.Screen name="TabMessagerie"  component={MessagerieStack} options={{ tabBarLabel: 'Messages' }} />
    <Tab.Screen
      name="TabProfil"
      component={ProfilScreen}
      options={{ tabBarLabel: 'Profil', headerShown: true, ...headerOptions, title: 'Mon profil' }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
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

export default AppNavigator;