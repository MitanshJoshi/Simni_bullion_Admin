import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAdminUsers } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';
import type { AdminUserListItem } from '../services/adminService';

type Nav = NativeStackNavigationProp<AppStackParamList, 'UserList'>;

const KYC_COLORS: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: colors.greenLight, color: colors.green },
  PENDING: { bg: '#FFFBEB', color: '#B45309' },
  REJECTED: { bg: colors.redLight, color: colors.red },
};

export default function UserListScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading, refetch } = useAdminUsers(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  );
  const users = data?.items ?? [];

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const renderItem = ({ item }: { item: AdminUserListItem }) => {
    const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || 'No name';
    const kycColor = item.kycStatus ? (KYC_COLORS[item.kycStatus] ?? { bg: '#F3F4F6', color: colors.textSecondary }) : null;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, !item.isActive && styles.avatarInactive]}>
            <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{name}</Text>
              {!item.isActive && (
                <View style={styles.deactivatedPill}>
                  <Text style={styles.deactivatedText}>Deactivated</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userMeta}>Joined {date} · ID: {item.loginId}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          {kycColor && item.kycStatus ? (
            <View style={[styles.kycBadge, { backgroundColor: kycColor.bg }]}>
              <Text style={[styles.kycText, { color: kycColor.color }]}>{item.kycStatus}</Text>
            </View>
          ) : (
            <View style={[styles.kycBadge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.kycText, { color: colors.textSecondary }]}>No KYC</Text>
            </View>
          )}
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
        <Text style={styles.title}>Users</Text>
        <Text style={styles.count}>{data?.total ?? 0}</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users found</Text>
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

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    color: colors.primary,
  },
  clearText: { fontSize: 14, color: colors.textMuted, padding: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },

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
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInactive: { backgroundColor: '#F3F4F6' },
  avatarText: { fontFamily: fonts.interBold, fontSize: 17, color: '#1D4ED8' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  userName: { fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.primary },
  deactivatedPill: { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  deactivatedText: { fontFamily: fonts.interMedium, fontSize: 9, color: colors.textSecondary },
  userEmail: { fontFamily: fonts.interRegular, fontSize: 12, color: colors.textMuted },
  userMeta: { fontFamily: fonts.interRegular, fontSize: 11, color: colors.textMuted, marginTop: 2 },

  cardRight: { alignItems: 'flex-end', gap: 6 },
  kycBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  kycText: { fontFamily: fonts.interSemiBold, fontSize: 10 },
  chevron: { fontSize: 22, color: colors.textMuted },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: fonts.interMedium, fontSize: 15, color: colors.textSecondary },
});
