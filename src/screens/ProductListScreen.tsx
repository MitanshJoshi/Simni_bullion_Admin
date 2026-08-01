import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProducts, useDeleteProduct } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { AdminProduct } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'ProductList'>;

export default function ProductListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: products, isLoading, refetch } = useProducts();
  const deleteProduct = useDeleteProduct();

  const handleDelete = (item: AdminProduct) => {
    Alert.alert('Delete Product', `Delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProduct.mutate(item.id, {
            onError: () => Alert.alert('Error', 'Failed to delete product'),
          });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AdminProduct }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.metalBadge, { backgroundColor: item.metal === 'GOLD' ? '#FFFBEB' : '#F3F4F6' }]}>
          <Text style={styles.metalIcon}>{item.metal === 'GOLD' ? '🥇' : '🥈'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{item.name}</Text>
            {!item.isActive && (
              <View style={styles.inactivePill}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
          <Text style={styles.productMeta}>
            ₹{Number(item.premiumPerGram).toFixed(2)}/g premium · min {item.minQuantityGrams}g
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            navigation.navigate('ProductForm', {
              productId: item.id,
              name: item.name,
              metal: item.metal,
              premiumPerGram: String(item.premiumPerGram),
              minQuantityGrams: item.minQuantityGrams,
              unitSizeGrams: item.unitSizeGrams,
              subtitle: item.subtitle,
              isActive: item.isActive,
            })
          }
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ProductForm', undefined)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🪙</Text>
              <Text style={styles.emptyText}>No products yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('ProductForm', undefined)}>
                <Text style={styles.emptyBtnText}>Add First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

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
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.accent },

  list: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  metalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metalIcon: { fontSize: 22 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  productName: { fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.primary },
  inactivePill: { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  inactiveText: { fontFamily: fonts.interMedium, fontSize: 10, color: colors.textSecondary },
  productMeta: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted },

  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.primary },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.redLight, borderRadius: 6, borderWidth: 1, borderColor: colors.red + '44' },
  deleteBtnText: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.red },

  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: fonts.interMedium, fontSize: 15, color: colors.textSecondary },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: fonts.interSemiBold, fontSize: 14, color: colors.accent },
});
