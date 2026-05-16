import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
// ✅ Ajout du SafeAreaProvider — nécessaire pour que
// useSafeAreaInsets() fonctionne dans AppNavigator
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/services/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);