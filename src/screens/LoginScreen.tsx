import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts, radius } from '../constants/theme';
import { login } from '../services/authService';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store';

// ADMIN_EMAILS are validated server-side via adminMiddleware.
// We just store tokens and let the server reject non-admins.

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const id = loginId.trim();
    if (!id || !password) {
      setError('Login ID and password are required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await login(id, password);

      await Promise.all([
        SecureStore.setItemAsync('admin_access_token', res.accessToken),
        SecureStore.setItemAsync('admin_refresh_token', res.refreshToken),
      ]);

      dispatch(setCredentials({ user: res.user, accessToken: res.accessToken }));
    } catch (err: any) {
      const msg: string = err?.message ?? 'Login failed. Please try again.';
      // Surface a friendlier message for non-admin users
      if (msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('admin')) {
        setError('This account does not have admin access.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SB</Text>
            </View>
            <Text style={styles.brandName}>Simni Bullion</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN PANEL</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>Admin access only</Text>

            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login ID */}
            <Text style={styles.label}>LOGIN ID</Text>
            <TextInput
              style={styles.input}
              placeholder="BLN-XXXXX"
              placeholderTextColor={colors.textMuted}
              value={loginId}
              onChangeText={(v) => { setLoginId(v); setError(null); }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Password */}
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((p) => !p)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Restricted to authorized administrators only.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontFamily: fonts.interBold,
    fontSize: 26,
    color: colors.accent,
    letterSpacing: 1,
  },
  brandName: {
    fontFamily: fonts.interBold,
    fontSize: 22,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  adminBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.accentLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  adminBadgeText: {
    fontFamily: fonts.interBold,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1.5,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: fonts.interBold,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
  },

  // Error
  errorBanner: {
    backgroundColor: colors.redLight,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
    color: colors.red,
    lineHeight: 18,
  },

  // Inputs
  label: {
    fontFamily: fonts.interMedium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.interRegular,
    fontSize: 15,
    color: colors.text,
    marginBottom: 18,
  },
  passwordRow: {
    position: 'relative',
    marginBottom: 18,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  eyeText: {
    fontSize: 18,
  },

  // Button
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: fonts.interBold,
    fontSize: 16,
    color: colors.accent,
    letterSpacing: 0.5,
  },

  footer: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
