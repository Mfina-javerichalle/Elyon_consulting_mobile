import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/services/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}

registerRootComponent(App);