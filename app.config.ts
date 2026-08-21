import { ExpoConfig, ConfigContext } from 'expo/config';

const ENV = {
  local: {
    apiUrl: 'http://192.168.1.12:3000',
  },
  development: {
    apiUrl: 'https://simni-bullion-app-be-rhbg.onrender.com',
  },
  production: {
    apiUrl: 'https://simni-bullion-app-be-rhbg.onrender.com',
  },
};

const CURRENT_ENV = (process.env.APP_ENV || 'development') as keyof typeof ENV;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Simni Admin',
  slug: 'simnibullion-admin',
  ios: {
    bundleIdentifier: 'com.simnibullion.admin',
    supportsTablet: true,
    buildNumber: '1',
    infoPlist: {
      // App only uses standard HTTPS/TLS — exempt from export compliance.
      // Prevents App Store Connect from blocking each submission with the
      // "missing compliance" prompt.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.simnibullion.admin',
    versionCode: 1,
  },
  extra: {
    apiUrl: process.env.API_URL || ENV[CURRENT_ENV].apiUrl,
    // True when API_URL was set explicitly — tells the client to skip dev
    // auto-detection and honor the configured URL even while developing.
    apiUrlForced: Boolean(process.env.API_URL),
    env: CURRENT_ENV,
    eas: {
      projectId: '5b52940c-0dc3-49c4-b5e0-cc4d803493e1',
    },
  },
  plugins: ['expo-secure-store', 'expo-font'],
});
