import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useApproveKyc, useRejectKyc } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<AppStackParamList, 'KycDetail'>;
type Route = RouteProp<AppStackParamList, 'KycDetail'>;

export default function KycDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approve = useApproveKyc();
  const reject = useRejectKyc();

  const name = [params.firstName, params.lastName].filter(Boolean).join(' ') || 'No name';
  const submittedAt = params.kycProfile.submittedAt
    ? new Date(params.kycProfile.submittedAt).toLocaleString()
    : '—';

  const handleApprove = () => {
    Alert.alert('Approve KYC', `Approve KYC for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          approve.mutate(params.userId, {
            onSuccess: () => navigation.goBack(),
            onError: () => Alert.alert('Error', 'Failed to approve KYC'),
          });
        },
      },
    ]);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Please enter a rejection reason');
      return;
    }
    reject.mutate(
      { userId: params.userId, rejectReason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectModal(false);
          navigation.goBack();
        },
        onError: () => Alert.alert('Error', 'Failed to reject KYC'),
      },
    );
  };

  const isBusy = approve.isPending || reject.isPending;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>KYC Review</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Applicant</Text>
          <View style={styles.card}>
            <Row label="Name" value={name} />
            <Row label="Email" value={params.email} />
          </View>
        </View>

        {/* KYC card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KYC Profile</Text>
          <View style={styles.card}>
            <Row label="Account Type" value={params.kycProfile.accountType} />
            <Row label="Status" value={<StatusPill status={params.kycProfile.status} />} />
            <Row label="Submitted" value={submittedAt} />
            {params.kycProfile.rejectReason ? (
              <Row label="Reject Reason" value={params.kycProfile.rejectReason} />
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn, isBusy && styles.btnDisabled]}
            onPress={handleApprove}
            disabled={isBusy}
          >
            {approve.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.btnText}>✓  Approve</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn, isBusy && styles.btnDisabled]}
            onPress={() => setRejectModal(true)}
            disabled={isBusy}
          >
            <Text style={[styles.btnText, styles.rejectBtnText]}>✕  Reject</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reject modal */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reject KYC</Text>
            <Text style={styles.modalSubtitle}>Provide a reason for rejection</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setRejectModal(false); setRejectReason(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmRejectBtn, reject.isPending && styles.btnDisabled]}
                onPress={handleReject}
                disabled={reject.isPending}
              >
                {reject.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={rowStyles.value}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: '#FFFBEB', color: '#B45309' },
    APPROVED: { bg: colors.greenLight, color: colors.green },
    REJECTED: { bg: colors.redLight, color: colors.red },
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: colors.textSecondary };
  return (
    <View style={[pillStyles.pill, { backgroundColor: s.bg }]}>
      <Text style={[pillStyles.text, { color: s.color }]}>{status}</Text>
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
  value: { fontFamily: fonts.interSemiBold, fontSize: 13, color: colors.primary, flexShrink: 1, textAlign: 'right' },
});

const pillStyles = StyleSheet.create({
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontFamily: fonts.interSemiBold, fontSize: 12 },
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
  scroll: { padding: 16, paddingBottom: 40 },

  section: { marginBottom: 20 },
  sectionLabel: {
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

  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: colors.green },
  rejectBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.red },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: fonts.interBold, fontSize: 15, color: colors.white },
  rejectBtnText: { color: colors.red },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontFamily: fonts.interBold, fontSize: 18, color: colors.primary, marginBottom: 4 },
  modalSubtitle: { fontFamily: fonts.interRegular, fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    color: colors.primary,
    minHeight: 100,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.textSecondary },
  confirmRejectBtn: { backgroundColor: colors.red },
});
