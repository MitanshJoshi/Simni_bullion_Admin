import { ExpoConfig, ConfigContext } from 'expo/config';

const ENV = {
  local: {
    apiUrl: 'http://192.168.1.12:3000',
  },
  development: {
    apiUrl: 'https://simni-bullion-app-be.onrender.com',
  },
  production: {
    apiUrl: 'https://simni-bullion-app-be.onrender.com',
  },
};

const CURRENT_ENV = (process.env.APP_ENV || 'local') as keyof typeof ENV;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Simni Admin',
  slug: 'simnibullion-admin',
  ios: {
    bundleIdentifier: 'com.simnibullion.admin',
    supportsTablet: true,
  },
  android: {
    package: 'com.simnibullion.admin',
  },
  extra: {
    apiUrl: process.env.API_URL || ENV[CURRENT_ENV].apiUrl,
    env: CURRENT_ENV,
  },
  plugins: ['expo-secure-store', 'expo-font'],
});
