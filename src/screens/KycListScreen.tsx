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
import { usePendingKyc } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { PendingKycItem } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'KycList'>;

export default function KycListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch } = usePendingKyc();

  const items = data?.items ?? [];

  const renderItem = ({ item }: { item: PendingKycItem }) => {
    const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || 'No name';
    const date = item.kycProfile.submittedAt
      ? new Date(item.kycProfile.submittedAt).toLocaleDateString()
      : '—';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('KycDetail', { ...item })}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.kycProfile.accountType}</Text>
          </View>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.chevron}>›</Text>
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
        <Text style={styles.title}>KYC Applications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{data?.total ?? 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No pending KYC applications</Text>
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
  badge: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: fonts.interBold, fontSize: 12, color: colors.white },

  list: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontFamily: fonts.interBold, fontSize: 16, color: '#7C3AED' },
  userName: { fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.primary },
  userEmail: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },

  cardRight: { alignItems: 'flex-end', gap: 4 },
  typeBadge: {
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: { fontFamily: fonts.interSemiBold, fontSize: 11, color: '#7C3AED' },
  dateText: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.textMuted },

  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: fonts.interMedium, fontSize: 15, color: colors.textSecondary },
});
