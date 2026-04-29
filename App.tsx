import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './src/store';
import { setCredentials } from './src/store/authSlice';
import { getMe } from './src/services/authService';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppInner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });

        const token = await SecureStore.getItemAsync('admin_access_token');
        if (token) {
          try {
            const user = await getMe();
            store.dispatch(setCredentials({ user, accessToken: token }));
          } catch {
            await SecureStore.deleteItemAsync('admin_access_token');
            await SecureStore.deleteItemAsync('admin_refresh_token');
          }
        }
      } catch (e) {
        console.warn('Prepare error:', e);
      } finally {
        setReady(true);
      }
    }
    prepare();
  }, []);

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
