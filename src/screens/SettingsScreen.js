import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePro } from '../contexts/ProContext';
import PaywallModal from '../components/PaywallModal';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { isPro, setIsPro, restorePurchase } = usePro();
  const [paywallVisible, setPaywallVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      {/* Pro status card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <Ionicons
            name="diamond"
            size={22}
            color={isPro ? colors.primary : colors.textSecondary}
          />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {isPro ? 'PixelHabit Pro' : 'Free plan'}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              {isPro ? 'All features unlocked' : 'Limited to 3 habits'}
            </Text>
          </View>
          {isPro && (
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {!isPro && (
          <TouchableOpacity
            onPress={() => setPaywallVisible(true)}
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restore */}
      {!isPro && (
        <TouchableOpacity
          onPress={restorePurchase}
          style={styles.restoreBtn}
        >
          <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
            Restore purchase
          </Text>
        </TouchableOpacity>
      )}

      {/* Debug: reset pro (dev only) */}
      {isPro && (
        <TouchableOpacity
          onPress={() => setIsPro(false)}
          style={styles.restoreBtn}
        >
          <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
            Reset to free (dev)
          </Text>
        </TouchableOpacity>
      )}

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 28,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  upgradeBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 14,
  },
});
