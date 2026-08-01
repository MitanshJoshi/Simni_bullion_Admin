import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { usePriceConfig, useUpdatePriceConfig } from '../hooks/useAdmin';
import { clearCredentials } from '../store/authSlice';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const { data: config, isLoading: configLoading } = usePriceConfig();
  const updateConfig = useUpdatePriceConfig();

  const [goldMin, setGoldMin] = useState('');
  const [silverMin, setSilverMin] = useState('');
  const [goldSpot, setGoldSpot] = useState('');
  const [silverSpot, setSilverSpot] = useState('');

  useEffect(() => {
    if (config) {
      setGoldMin(String(config.goldMinBuyGrams));
      setSilverMin(String(config.silverMinBuyGrams));
      setGoldSpot(String(config.goldSpotPerGram ?? 0));
      setSilverSpot(String(config.silverSpotPerGram ?? 0));
    }
  }, [config]);

  const handleSaveConfig = () => {
    if (!goldMin || isNaN(Number(goldMin)) || Number(goldMin) <= 0) {
      Alert.alert('Validation', 'Enter a valid gold minimum');
      return;
    }
    if (!silverMin || isNaN(Number(silverMin)) || Number(silverMin) <= 0) {
      Alert.alert('Validation', 'Enter a valid silver minimum');
      return;
    }
    if (goldSpot === '' || isNaN(Number(goldSpot)) || Number(goldSpot) < 0) {
      Alert.alert('Validation', 'Enter a valid gold spot price');
      return;
    }
    if (silverSpot === '' || isNaN(Number(silverSpot)) || Number(silverSpot) < 0) {
      Alert.alert('Validation', 'Enter a valid silver spot price');
      return;
    }
    updateConfig.mutate(
      {
        goldMinBuyGrams: Number(goldMin),
        silverMinBuyGrams: Number(silverMin),
        goldSpotPerGram: Number(goldSpot),
        silverSpotPerGram: Number(silverSpot),
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Price config updated successfully'),
        onError: () => Alert.alert('Error', 'Failed to update config'),
      },
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('admin_access_token');
          await SecureStore.deleteItemAsync('admin_refresh_token');
          dispatch(clearCredentials());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Manual Spot Price */}
        <Text style={styles.sectionLabel}>Manual Spot Price (₹ / gram)</Text>
        <Text style={styles.helperText}>
          Used when the live feed is unavailable. Final buy price = spot + each product&apos;s premium.
        </Text>
        <View style={styles.card}>
          {configLoading ? (
            <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.accent} />
          ) : (
            <>
              <Field label="Gold Spot (₹/g)">
                <TextInput
                  style={styles.input}
                  value={goldSpot}
                  onChangeText={setGoldSpot}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 9200"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
              <Field label="Silver Spot (₹/g)" last>
                <TextInput
                  style={styles.input}
                  value={silverSpot}
                  onChangeText={setSilverSpot}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 110"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </>
          )}
        </View>

        {/* Price Config */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Minimum Buy Configuration</Text>

        {/* Current config (read-only) */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={styles.currentLabel}>Current Active Values</Text>
          {configLoading ? (
            <ActivityIndicator style={{ paddingVertical: 12 }} color={colors.accent} />
          ) : (
            <View style={styles.currentRow}>
              <View style={styles.currentItem}>
                <Text style={styles.currentMetal}>🥇 Gold</Text>
                <Text style={styles.currentValue}>{config ? `${config.goldMinBuyGrams}g` : '—'}</Text>
                <Text style={styles.currentSub}>min buy</Text>
              </View>
              <View style={styles.currentDivider} />
              <View style={styles.currentItem}>
                <Text style={styles.currentMetal}>🥈 Silver</Text>
                <Text style={styles.currentValue}>{config ? `${config.silverMinBuyGrams}g` : '—'}</Text>
                <Text style={styles.currentSub}>min buy</Text>
              </View>
            </View>
          )}
        </View>

        {/* Editable fields */}
        <View style={styles.card}>
          {configLoading ? (
            <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.accent} />
          ) : (
            <>
              <Field label="Gold Minimum Buy (grams)">
                <TextInput
                  style={styles.input}
                  value={goldMin}
                  onChangeText={setGoldMin}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 0.5"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
              <Field label="Silver Minimum Buy (grams)" last>
                <TextInput
                  style={styles.input}
                  value={silverMin}
                  onChangeText={setSilverMin}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 5"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </>
          )}
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, (updateConfig.isPending || configLoading) && styles.saveBtnDisabled]}
          onPress={handleSaveConfig}
          disabled={updateConfig.isPending || configLoading}
        >
          {updateConfig.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Configuration</Text>
          )}
        </TouchableOpacity>

        {/* Logout */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Account</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[fieldStyles.field, last && { borderBottomWidth: 0 }]}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontFamily: fonts.interMedium, fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { fontSize: 28, color: colors.primary, lineHeight: 32 },
  title: { fontFamily: fonts.interBold, fontSize: 18, color: colors.primary },
  scroll: { padding: 20, paddingBottom: 60 },

  sectionLabel: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  helperText: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -6,
    marginBottom: 12,
    lineHeight: 17,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.interRegular,
    fontSize: 15,
    color: colors.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: fonts.interBold, fontSize: 15, color: colors.accent },

  logoutBtn: {
    backgroundColor: colors.redLight,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.red + '44',
  },
  logoutText: { fontFamily: fonts.interBold, fontSize: 15, color: colors.red },

  currentLabel: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingTop: 12,
    marginBottom: 12,
  },
  currentRow: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  currentItem: { flex: 1, alignItems: 'center' },
  currentMetal: { fontFamily: fonts.interMedium, fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  currentValue: { fontFamily: fonts.interBold, fontSize: 22, color: colors.primary },
  currentSub: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  currentDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
});
