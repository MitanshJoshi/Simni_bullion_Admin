import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCreateProduct, useUpdateProduct } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<AppStackParamList, 'ProductForm'>;
type Route = RouteProp<AppStackParamList, 'ProductForm'>;

export default function ProductFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const isEdit = !!params?.productId;

  const [name, setName] = useState(params?.name ?? '');
  const [metal, setMetal] = useState<'GOLD' | 'SILVER'>(params?.metal ?? 'GOLD');
  const [premium, setPremium] = useState(params?.premiumPerGram ?? '');
  const [minQty, setMinQty] = useState(params?.minQuantityGrams?.toString() ?? '');
  const [unitSize, setUnitSize] = useState(params?.unitSizeGrams?.toString() ?? '');
  const [presets, setPresets] = useState(params?.quantityPresetsGrams?.join(', ') ?? '');
  const [subtitle, setSubtitle] = useState(params?.subtitle ?? '');
  const [isActive, setIsActive] = useState(params?.isActive ?? true);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isBusy = createProduct.isPending || updateProduct.isPending;

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Validation', 'Product name is required'); return; }
    if (!premium || isNaN(Number(premium))) { Alert.alert('Validation', 'Valid premium per gram is required'); return; }
    if (!minQty || isNaN(Number(minQty))) { Alert.alert('Validation', 'Valid minimum quantity is required'); return; }

    let quantityPresetsGrams: number[] | null = null;
    if (!unitSize && presets.trim()) {
      const parsed = presets.split(',').map((s) => Number(s.trim()));
      if (parsed.length !== 4 || parsed.some((n) => isNaN(n) || n <= 0)) {
        Alert.alert('Validation', 'Quantity presets must be exactly 4 comma-separated positive numbers');
        return;
      }
      if (parsed.some((n) => n < Number(minQty))) {
        Alert.alert('Validation', `Quantity presets must all be >= minimum order quantity (${minQty}g)`);
        return;
      }
      quantityPresetsGrams = parsed;
    }

    const input = {
      name: name.trim(),
      metal,
      premiumPerGram: Number(premium),
      minQuantityGrams: Number(minQty),
      unitSizeGrams: unitSize ? Number(unitSize) : null,
      quantityPresetsGrams,
      subtitle: subtitle.trim() || undefined,
      isActive,
    };

    if (isEdit && params?.productId) {
      updateProduct.mutate(
        { id: params.productId, input },
        {
          onSuccess: () => navigation.goBack(),
          onError: () => Alert.alert('Error', 'Failed to update product'),
        },
      );
    } else {

      console.log("input is",input)
      createProduct.mutate(input, {
        onSuccess: () => navigation.goBack(),
        onError: () => Alert.alert('Error', 'Failed to create product'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Product Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gold Bar 999"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Metal">
          <View style={styles.segmentRow}>
            {(['GOLD', 'SILVER'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.segment, metal === m && styles.segmentActive]}
                onPress={() => setMetal(m)}
              >
                <Text style={[styles.segmentText, metal === m && styles.segmentTextActive]}>
                  {m === 'GOLD' ? '🥇 Gold' : '🥈 Silver'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Premium per Gram (₹)">
          <TextInput
            style={styles.input}
            value={String(premium)}
            onChangeText={setPremium}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Unit Size (grams) — leave blank for free gram input">
          <TextInput
            style={styles.input}
            value={unitSize}
            onChangeText={setUnitSize}
            placeholder="e.g. 100 for a 100g Gold Bar"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </Field>

        {!unitSize && (
          <Field label="Quantity Presets (grams) — exactly 4, comma-separated">
            <TextInput
              style={styles.input}
              value={presets}
              onChangeText={setPresets}
              placeholder="e.g. 5, 10, 25, 50"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
        )}

        <Field label="Minimum Order Quantity (grams)">
          <TextInput
            style={styles.input}
            value={minQty}
            onChangeText={setMinQty}
            placeholder="e.g. 100 for 1 bar, 200 for 2 bars"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Subtitle (optional)">
          <TextInput
            style={styles.input}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. 999.9 Fine Gold"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Active</Text>
            <Text style={styles.switchSub}>Show this product to customers</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.border, true: colors.green }}
            thumbColor={colors.white}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.field}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.primary, marginBottom: 8 },
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
  title: { flex: 1, fontFamily: fonts.interBold, fontSize: 18, color: colors.primary },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: fonts.interBold, fontSize: 14, color: colors.accent },

  scroll: { padding: 20, paddingBottom: 60 },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.interRegular,
    fontSize: 15,
    color: colors.primary,
  },
  multiline: { minHeight: 90, paddingTop: 12 },

  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.interSemiBold, fontSize: 14, color: colors.textSecondary },
  segmentTextActive: { color: colors.accent },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.primary },
  switchSub: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
