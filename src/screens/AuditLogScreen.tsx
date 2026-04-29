import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuditLogs } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { AuditLogEntry } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'AuditLog'>;

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  KYC_APPROVED: { bg: colors.greenLight, color: colors.green },
  KYC_REJECTED: { bg: colors.redLight, color: colors.red },
  ORDER_APPROVED: { bg: colors.greenLight, color: colors.green },
  ORDER_REJECTED: { bg: colors.redLight, color: colors.red },
  PRODUCT_CREATED: { bg: '#EFF6FF', color: '#1D4ED8' },
  PRODUCT_UPDATED: { bg: '#EFF6FF', color: '#1D4ED8' },
  PRODUCT_DELETED: { bg: colors.redLight, color: colors.red },
  BANK_ACCOUNT_CREATED: { bg: '#F5F3FF', color: '#7C3AED' },
};

export default function AuditLogScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch } = useAuditLogs({ limit: 50 });
  const logs = data?.items ?? [];

  const renderItem = ({ item }: { item: AuditLogEntry }) => {
    const ac = ACTION_COLORS[item.action] ?? { bg: '#F3F4F6', color: colors.textSecondary };
    const date = new Date(item.createdAt);
    const dateStr = date.toLocaleDateString('en-IN');
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.actionBadge, { backgroundColor: ac.bg }]}>
            <Text style={[styles.actionText, { color: ac.color }]}>
              {item.action.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.adminEmail}>{item.adminEmail}</Text>
          {item.entityType && item.entityId && (
            <Text style={styles.entityText}>
              {item.entityType} · {item.entityId.slice(0, 8)}...
            </Text>
          )}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <Text style={styles.metaText} numberOfLines={2}>
              {Object.entries(item.metadata)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.count}>{data?.total ?? 0} entries</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l) => l.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No audit events yet</Text>
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
  count: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted },

  list: { padding: 16, gap: 8, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardLeft: { flex: 1, gap: 4 },
  actionBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2 },
  actionText: { fontFamily: fonts.interBold, fontSize: 11 },
  adminEmail: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.primary },
  entityText: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted },
  metaText: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },

  cardRight: { alignItems: 'flex-end', gap: 2 },
  dateText: { fontFamily: fonts.interMedium, fontSize: 12, color: colors.textSecondary },
  timeText: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted },

  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: fonts.interMedium, fontSize: 15, color: colors.textSecondary },
});
