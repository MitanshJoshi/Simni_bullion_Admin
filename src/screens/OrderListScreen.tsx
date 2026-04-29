import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAdminOrders } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { AdminOrder, OrderStatus } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'OrderList'>;

const TABS: { label: string; status?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Awaiting', status: 'PAYMENT_SUBMITTED' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Rejected', status: 'REJECTED' },
  { label: 'Pending', status: 'PENDING_PAYMENT' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#FEF3C7', color: '#92400E' },
  PAYMENT_SUBMITTED: { bg: '#EFF6FF', color: '#1D4ED8' },
  APPROVED: { bg: colors.greenLight, color: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red },
  CANCELLED: { bg: '#F3F4F6', color: colors.textSecondary },
};

export default function OrderListScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState(0);
  const { status } = TABS[activeTab];

  const { data, isLoading, refetch } = useAdminOrders(status);
  const orders = data?.orders ?? [];

  const renderItem = ({ item }: { item: AdminOrder }) => {
    const userName = [item.user.firstName, item.user.lastName].filter(Boolean).join(' ') || item.user.email;
    const sc = STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', color: colors.textSecondary };
    const total = Number(item.totalAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const date = new Date(item.createdAt).toLocaleDateString('en-IN');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.metalChip}>
            <Text style={styles.metalText}>{item.metal === 'GOLD' ? '🥇' : '🥈'} {item.metal}</Text>
          </View>
          <Text style={styles.qty}>{item.quantityGrams}g</Text>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{data?.total ?? 0}</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No orders found</Text>
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
  count: { fontFamily: fonts.interBold, fontSize: 13, color: colors.textSecondary },

  tabBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 48 },
  tabContent: { paddingHorizontal: 12, gap: 4, alignItems: 'center' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 6,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: fonts.interMedium, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  list: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontFamily: fonts.interBold, fontSize: 13, color: colors.primary },
  userName: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: fonts.interSemiBold, fontSize: 11 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metalChip: { backgroundColor: colors.background, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  metalText: { fontFamily: fonts.interSemiBold, fontSize: 12, color: colors.primary },
  qty: { fontFamily: fonts.interMedium, fontSize: 12, color: colors.textSecondary },
  total: { flex: 1, fontFamily: fonts.interBold, fontSize: 14, color: colors.primary, textAlign: 'right' },
  date: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted },

  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: fonts.interMedium, fontSize: 15, color: colors.textSecondary },
});
