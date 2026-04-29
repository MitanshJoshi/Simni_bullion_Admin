import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../store';
import { usePendingKyc, useAdminOrders } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface NavTile {
  label: string;
  icon: string;
  screen: string;
  color: string;
  bg: string;
}

const NAV_TILES: NavTile[] = [
  { label: 'KYC',      icon: '🪪', screen: 'KycList',     color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Orders',   icon: '📦', screen: 'OrderList',   color: '#0369A1', bg: '#F0F9FF' },
  { label: 'Products', icon: '🪙', screen: 'ProductList', color: '#B45309', bg: '#FFFBEB' },
  { label: 'Users',    icon: '👥', screen: 'UserList',    color: '#065F46', bg: '#ECFDF5' },
  { label: 'Settings', icon: '⚙️', screen: 'Settings',    color: '#374151', bg: '#F9FAFB' },
  { label: 'Audit Log',icon: '📋', screen: 'AuditLog',    color: '#9D174D', bg: '#FDF2F8' },
];

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);

  const {
    data: kycData,
    isLoading: kycLoading,
    refetch: refetchKyc,
  } = usePendingKyc();

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useAdminOrders('PAYMENT_SUBMITTED');

  const pendingKyc = kycData?.total ?? 0;
  const pendingOrders = ordersData?.total ?? 0;
  const isRefreshing = kycLoading || ordersLoading;

  const onRefresh = () => {
    refetchKyc();
    refetchOrders();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>
              {user?.firstName ?? 'Admin'} {user?.lastName ?? ''}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] ?? 'A').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Pending badges */}
        <Text style={styles.sectionTitle}>Needs Attention</Text>
        <View style={styles.badgeRow}>
          <BadgeCard
            icon="🪪"
            label="Pending KYC"
            count={pendingKyc}
            loading={kycLoading}
            color="#7C3AED"
            bg="#F5F3FF"
          />
          <View style={{ width: 12 }} />
          <BadgeCard
            icon="💳"
            label="Pending Payments"
            count={pendingOrders}
            loading={ordersLoading}
            color="#0369A1"
            bg="#F0F9FF"
          />
        </View>

        {/* Nav tiles */}
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.tilesGrid}>
          {NAV_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.screen}
              style={styles.tile}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(tile.screen as any)}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: tile.bg }]}>
                <Text style={styles.tileIcon}>{tile.icon}</Text>
              </View>
              <Text style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────

function BadgeCard({
  icon, label, count, loading, color, bg,
}: {
  icon: string;
  label: string;
  count: number;
  loading: boolean;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '33' }]}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={[styles.badgeCount, { color }]}>
        {loading ? '—' : count}
      </Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  name: {
    fontFamily: fonts.interBold,
    fontSize: 22,
    color: colors.primary,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.interBold,
    fontSize: 18,
    color: colors.accent,
  },

  sectionTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  badge: {
    flex: 1,
    borderRadius: radius.md,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 28, marginBottom: 8 },
  badgeCount: {
    fontFamily: fonts.interBold,
    fontSize: 36,
    lineHeight: 40,
    marginBottom: 4,
  },
  badgeLabel: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Nav tiles
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileIcon: { fontSize: 22 },
  tileLabel: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
});
