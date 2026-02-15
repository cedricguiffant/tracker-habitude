import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePro } from '../contexts/ProContext';

const FEATURES = [
  { icon: 'infinite', text: 'Unlimited habits' },
  { icon: 'color-palette', text: 'Custom colors & themes' },
  { icon: 'stats-chart', text: 'Advanced statistics' },
  { icon: 'cloud-upload', text: 'Cloud backup & sync' },
];

export default function PaywallModal({ visible, onClose }) {
  const { colors } = useTheme();
  const { setIsPro } = usePro();

  async function handleUpgrade() {
    // TODO: replace with RevenueCat purchase flow
    //   const { customerInfo } = await Purchases.purchasePackage(proPackage);
    //   if (customerInfo.entitlements.active['pro']) setIsPro(true);
    await setIsPro(true);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.handle} />

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="diamond" size={36} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Upgrade to Pro
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You've reached the limit of 3 free habits.{'\n'}
            Go Pro to unlock everything.
          </Text>

          {/* Feature list */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleUpgrade}
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.ctaText}>Upgrade to Pro</Text>
          </TouchableOpacity>

          <Text style={[styles.priceHint, { color: colors.textSecondary }]}>
            One-time purchase — no subscription
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  features: {
    alignSelf: 'stretch',
    gap: 14,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  ctaBtn: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  priceHint: {
    fontSize: 12,
  },
});
