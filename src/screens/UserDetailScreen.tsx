import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAdminUserDetail, useActivateUser, useDeactivateUser } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { AdminOrder } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'UserDetail'>;
type Route = RouteProp<AppStackParamList, 'UserDetail'>;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: colors.greenLight, color: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red },
  PENDING_PAYMENT: { bg: '#FEF3C7', color: '#92400E' },
  PAYMENT_SUBMITTED: { bg: '#EFF6FF', color: '#1D4ED8' },
  CANCELLED: { bg: '#F3F4F6', color: colors.textSecondary },
};

function Row({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {typeof value === 'string' ? <Text style={rowStyles.value}>{value}</Text> : value}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontFamily: fonts.interMedium, fontSize: 13, color: colors.textSecondary },
  value: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.primary, flexShrink: 1, textAlign: 'right', paddingLeft: 12 },
});

export default function UserDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const { data: user, isLoading } = useAdminUserDetail(params.userId);
  const activate = useActivateUser();
  const deactivate = useDeactivateUser();

  const handleToggleActive = () => {
    if (!user) return;
    if (user.isActive) {
      Alert.alert('Deactivate User', `Deactivate ${user.email}? They will be logged out immediately.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivate.mutate(user.id, {
            onError: () => Alert.alert('Error', 'Failed to deactivate user'),
          }),
        },
      ]);
    } else {
      activate.mutate(user.id, {
        onError: () => Alert.alert('Error', 'Failed to activate user'),
      });
    }
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>User Detail</Text>
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
  const isBusy = activate.isPending || deactivate.isPending;

  const renderOrder = ({ item }: { item: AdminOrder }) => {
    const sc = STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', color: colors.textSecondary };
    const total = Number(item.totalAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View>
          <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderMeta}>{item.metal} · {item.quantityGrams}g · {total}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.color }]}>{item.status.replace(/_/g, ' ')}</Text>
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
        <Text style={styles.title}>{name}</Text>
        {user.isAdmin && (
          <View style={[styles.deactivatedBadge, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.deactivatedText, { color: '#1D4ED8' }]}>Admin</Text>
          </View>
        )}
        {!user.isActive && (
          <View style={styles.deactivatedBadge}>
            <Text style={styles.deactivatedText}>Deactivated</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile */}
        <Section title="Profile">
          <Row label="Name" value={name} />
          <Row label="Email" value={user.email} />
          <Row label="Login ID" value={user.loginId} />
          <Row label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
          <Row label="KYC Status" value={
            <View style={[styles.kycBadge, {
              backgroundColor: user.kycStatus ? (STATUS_COLORS[user.kycStatus]?.bg ?? '#F3F4F6') : '#F3F4F6',
            }]}>
              <Text style={[styles.kycText, {
                color: user.kycStatus ? (STATUS_COLORS[user.kycStatus]?.color ?? colors.textSecondary) : colors.textSecondary,
              }]}>
                {user.kycStatus ?? 'None'}
              </Text>
            </View>
          } />
        </Section>

        {/* Action */}
        {!user.isAdmin && (
          <TouchableOpacity
            style={[styles.toggleBtn, user.isActive ? styles.deactivateBtn : styles.activateBtn, isBusy && styles.btnDisabled]}
            onPress={handleToggleActive}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.toggleBtnText}>
                {user.isActive ? '🚫  Deactivate Account' : '✅  Activate Account'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Orders */}
        <Text style={styles.ordersTitle}>Order History ({user.orders?.length ?? 0})</Text>
        {(user.orders ?? []).length === 0 ? (
          <View style={styles.noOrders}>
            <Text style={styles.noOrdersText}>No orders yet</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {(user.orders ?? []).map((order) => (
              <View key={order.id}>
                {renderOrder({ item: order })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.section}>
      <Text style={sectionStyles.label}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: { marginBottom: 20 },
  label: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
    gap: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 28, color: colors.primary, lineHeight: 32 },
  title: { flex: 1, fontFamily: fonts.interBold, fontSize: 18, color: colors.primary },
  deactivatedBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  deactivatedText: { fontFamily: fonts.interSemiBold, fontSize: 11, color: colors.textSecondary },
  scroll: { padding: 16, paddingBottom: 40 },

  kycBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  kycText: { fontFamily: fonts.interSemiBold, fontSize: 12 },

  toggleBtn: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  deactivateBtn: { backgroundColor: colors.red },
  activateBtn: { backgroundColor: colors.green },
  btnDisabled: { opacity: 0.6 },
  toggleBtnText: { fontFamily: fonts.interBold, fontSize: 15, color: colors.white },

  ordersTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  noOrders: { alignItems: 'center', paddingVertical: 24 },
  noOrdersText: { fontFamily: fonts.interMedium, fontSize: 14, color: colors.textMuted },

  ordersList: { gap: 8 },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderId: { fontFamily: fonts.interBold, fontSize: 13, color: colors.primary },
  orderMeta: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: fonts.interSemiBold, fontSize: 11 },
});
