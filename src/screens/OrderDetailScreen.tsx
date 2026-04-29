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
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAdminOrder, useApproveOrder, useRejectOrder } from '../hooks/useAdmin';
import { colors, fonts, radius } from '../constants/theme';
import type { AppStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<AppStackParamList, 'OrderDetail'>;
type Route = RouteProp<AppStackParamList, 'OrderDetail'>;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#FEF3C7', color: '#92400E' },
  PAYMENT_SUBMITTED: { bg: '#EFF6FF', color: '#1D4ED8' },
  APPROVED: { bg: colors.greenLight, color: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red },
  CANCELLED: { bg: '#F3F4F6', color: colors.textSecondary },
};

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

export default function OrderDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: order, isLoading } = useAdminOrder(params.orderId);
  const approve = useApproveOrder();
  const reject = useRejectOrder();

  const handleApprove = () => {
    Alert.alert('Approve Order', 'Confirm payment and approve this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          approve.mutate(params.orderId, {
            onSuccess: () => navigation.goBack(),
            onError: () => Alert.alert('Error', 'Failed to approve order'),
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
      { orderId: params.orderId, rejectReason: rejectReason.trim() },
      {
        onSuccess: () => { setRejectModal(false); navigation.goBack(); },
        onError: () => Alert.alert('Error', 'Failed to reject order'),
      },
    );
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order Detail</Text>
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[order.status] ?? { bg: '#F3F4F6', color: colors.textSecondary };
  const userName = [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email;
  const fmt = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  const canAct = order.status === 'PAYMENT_SUBMITTED';
  const isBusy = approve.isPending || reject.isPending;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>#{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.color }]}>{order.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order */}
        <Section title="Order">
          <Row label="Metal" value={`${order.metal === 'GOLD' ? '🥇' : '🥈'} ${order.metal}`} />
          <Row label="Quantity" value={`${order.quantityGrams}g`} />
          <Row label="Price/gram" value={fmt(order.pricePerGram)} />
          <Row label="Total" value={fmt(order.totalAmount)} />
          <Row label="Date" value={new Date(order.createdAt).toLocaleString()} />
        </Section>

        {/* User */}
        <Section title="Customer">
          <Row label="Name" value={userName} />
          <Row label="Email" value={order.user.email} />
        </Section>

        {/* Bank */}
        <Section title="Bank Account">
          <Row label="Bank" value={order.bankAccount.bankName} />
          <Row label="Account" value={order.bankAccount.accountNumber} />
          <Row label="IFSC" value={order.bankAccount.ifscCode} />
          <Row label="Holder" value={order.bankAccount.accountHolderName} />
          {order.bankAccount.upiId ? <Row label="UPI" value={order.bankAccount.upiId} /> : null}
        </Section>

        {/* Payment proof */}
        {order.payment ? (
          <Section title="Payment Proof">
            <Row label="Submitted" value={new Date(order.payment.submittedAt).toLocaleString()} />
            <TouchableOpacity
              style={styles.screenshotBtn}
              onPress={() => Linking.openURL(order.payment!.screenshotUrl)}
            >
              <Text style={styles.screenshotBtnText}>🖼  View Screenshot</Text>
            </TouchableOpacity>
          </Section>
        ) : null}

        {order.rejectReason ? (
          <Section title="Rejection">
            <Row label="Reason" value={order.rejectReason} />
          </Section>
        ) : null}

        {/* Actions */}
        {canAct && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, isBusy && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={isBusy}
            >
              {approve.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>✓  Approve</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, isBusy && styles.btnDisabled]}
              onPress={() => setRejectModal(true)}
              disabled={isBusy}
            >
              <Text style={[styles.btnText, { color: colors.red }]}>✕  Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reject Order</Text>
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
                style={[styles.modalBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => { setRejectModal(false); setRejectReason(''); }}
              >
                <Text style={{ fontFamily: fonts.interSemiBold, fontSize: 15, color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.red }, reject.isPending && styles.btnDisabled]}
                onPress={handleReject}
                disabled={reject.isPending}
              >
                {reject.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: { flex: 1, fontFamily: fonts.interBold, fontSize: 16, color: colors.primary },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: fonts.interSemiBold, fontSize: 11 },
  scroll: { padding: 16, paddingBottom: 40 },
  screenshotBtn: {
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
  },
  screenshotBtnText: { fontFamily: fonts.interSemiBold, fontSize: 14, color: colors.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  approveBtn: { backgroundColor: colors.green },
  rejectBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.red },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: fonts.interBold, fontSize: 15, color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontFamily: fonts.interBold, fontSize: 18, color: colors.primary, marginBottom: 16 },
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
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.md, alignItems: 'center' },
});
