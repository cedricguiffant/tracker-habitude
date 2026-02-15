import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getHabits, saveHabits } from '../utils/storage';
import { generateId } from '../utils/habits';
import { usePro } from '../contexts/ProContext';
import {
  scheduleDailyReminder,
  cancelReminder,
  parseTimeString,
  formatTime,
} from '../utils/notifications';

const PRESET_COLORS = [
  '#6C63FF',
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#45B7D1',
  '#F78FB3',
  '#26DE81',
  '#FD9644',
  '#A55EEA',
  '#778CA3',
];

const QUICK_TIMES = [
  { label: 'Morning', hour: 8, minute: 0 },
  { label: 'Noon', hour: 12, minute: 0 },
  { label: 'Evening', hour: 18, minute: 0 },
  { label: 'Night', hour: 21, minute: 0 },
];

export default function AddEditHabitScreen({ navigation, route }) {
  const { colors, dark } = useTheme();
  const { canAddHabit } = usePro();
  const existing = route.params?.habit ?? null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(existing?.color ?? PRESET_COLORS[0]);
  const [type, setType] = useState(existing?.type ?? 'positive');
  const [saving, setSaving] = useState(false);

  // Reminder state
  const existingTime = existing?.reminderTime ? parseTimeString(existing.reminderTime) : null;
  const [reminderEnabled, setReminderEnabled] = useState(!!existingTime);
  const [reminderHour, setReminderHour] = useState(existingTime?.hour ?? 8);
  const [reminderMinute, setReminderMinute] = useState(existingTime?.minute ?? 0);

  function adjustTime(field, delta) {
    if (field === 'hour') {
      setReminderHour((h) => (h + delta + 24) % 24);
    } else {
      setReminderMinute((m) => {
        const next = m + delta;
        if (next >= 60) { setReminderHour((h) => (h + 1) % 24); return 0; }
        if (next < 0) { setReminderHour((h) => (h - 1 + 24) % 24); return 55; }
        return next;
      });
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Missing name', 'Please enter a habit name.');
      return;
    }

    setSaving(true);
    const habits = await getHabits();

    if (!isEdit && !canAddHabit(habits.length)) {
      Alert.alert('Limit reached', 'Upgrade to Pro to add more than 3 habits.');
      setSaving(false);
      return;
    }

    const reminderTime = reminderEnabled ? formatTime(reminderHour, reminderMinute) : null;
    let habitId;

    if (isEdit) {
      habitId = existing.id;
      const idx = habits.findIndex((h) => h.id === existing.id);
      if (idx !== -1) {
        habits[idx] = { ...habits[idx], name: trimmed, color: selectedColor, type, reminderTime };
      }
    } else {
      habitId = generateId();
      habits.push({
        id: habitId,
        name: trimmed,
        color: selectedColor,
        type,
        createdAt: new Date().toISOString(),
        checkIns: [],
        reminderTime,
      });
    }

    // Schedule or cancel the notification
    if (reminderTime) {
      await scheduleDailyReminder(habitId, trimmed, reminderHour, reminderMinute);
    } else {
      await cancelReminder(habitId);
    }

    await saveHabits(habits);
    navigation.goBack();
  }

  async function handleDelete() {
    Alert.alert(
      'Delete habit',
      `Delete "${existing.name}" and all its check-ins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelReminder(existing.id);
            const habits = await getHabits();
            const filtered = habits.filter((h) => h.id !== existing.id);
            await saveHabits(filtered);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEdit ? 'Edit habit' : 'New habit'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.previewBar, { backgroundColor: selectedColor }]} />
          <Text
            style={[styles.previewName, { color: name.trim() ? colors.text : colors.textSecondary }]}
            numberOfLines={1}
          >
            {name.trim() || 'Habit name...'}
          </Text>
          <View style={[styles.previewCircle, { borderColor: selectedColor }]}>
            <Ionicons name="checkmark" size={16} color={selectedColor} />
          </View>
        </View>

        {/* Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g. Meditation, Reading, Exercise..."
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus={!isEdit}
          maxLength={40}
        />

        {/* Type */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
        <View style={styles.typeRow}>
          {([
            { key: 'positive', icon: 'trending-up', label: 'Positive', desc: 'Build a good habit' },
            { key: 'negative', icon: 'trending-down', label: 'Negative', desc: 'Break a bad habit' },
          ]).map((t) => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: active ? selectedColor + '18' : colors.card,
                    borderColor: active ? selectedColor : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={t.icon}
                  size={22}
                  color={active ? selectedColor : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: active ? colors.text : colors.textSecondary },
                  ]}
                >
                  {t.label}
                </Text>
                <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>
                  {t.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((c) => {
            const active = selectedColor === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? c : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.colorDot, { backgroundColor: c }]} />
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                    style={styles.colorCheck}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reminder */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Reminder</Text>

        {/* Toggle */}
        <TouchableOpacity
          onPress={() => setReminderEnabled((v) => !v)}
          style={[
            styles.reminderToggle,
            {
              backgroundColor: colors.card,
              borderColor: reminderEnabled ? selectedColor : colors.border,
            },
          ]}
        >
          <Ionicons
            name={reminderEnabled ? 'notifications' : 'notifications-off-outline'}
            size={20}
            color={reminderEnabled ? selectedColor : colors.textSecondary}
          />
          <Text style={[styles.reminderToggleText, { color: colors.text }]}>
            {reminderEnabled ? 'Reminder on' : 'No reminder'}
          </Text>
          <View
            style={[
              styles.toggleTrack,
              { backgroundColor: reminderEnabled ? selectedColor : dark ? '#555' : '#CCC' },
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: reminderEnabled ? 18 : 0 }] },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Time picker (visible when enabled) */}
        {reminderEnabled && (
          <View style={styles.timeSection}>
            {/* Quick presets */}
            <View style={styles.quickTimes}>
              {QUICK_TIMES.map((qt) => {
                const active = reminderHour === qt.hour && reminderMinute === qt.minute;
                return (
                  <TouchableOpacity
                    key={qt.label}
                    onPress={() => { setReminderHour(qt.hour); setReminderMinute(qt.minute); }}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: active ? selectedColor : colors.card,
                        borderColor: active ? selectedColor : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#FFF' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      {qt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Scroll-style time picker */}
            <View style={[styles.timePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Hour */}
              <View style={styles.timeColumn}>
                <TouchableOpacity onPress={() => adjustTime('hour', 1)} style={styles.timeArrow}>
                  <Ionicons name="chevron-up" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.text }]}>
                  {String(reminderHour).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => adjustTime('hour', -1)} style={styles.timeArrow}>
                  <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>

              {/* Minute */}
              <View style={styles.timeColumn}>
                <TouchableOpacity onPress={() => adjustTime('minute', 5)} style={styles.timeArrow}>
                  <Ionicons name="chevron-up" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.text }]}>
                  {String(reminderMinute).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => adjustTime('minute', -5)} style={styles.timeArrow}>
                  <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: selectedColor, opacity: saving ? 0.6 : 1 }]}
        >
          <Ionicons name={isEdit ? 'checkmark' : 'add'} size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {isEdit ? 'Save changes' : 'Create habit'}
          </Text>
        </TouchableOpacity>

        {/* Delete button (edit mode only) */}
        {isEdit && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            <Text style={styles.deleteBtnText}>Delete habit</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Form
  form: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },

  // Preview
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  previewBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  previewName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  previewCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  // Type cards
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Color grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorCheck: {
    position: 'absolute',
  },

  // Reminder toggle
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  reminderToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },

  // Time section
  timeSection: {
    marginBottom: 28,
    gap: 12,
  },
  quickTimes: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },

  // Time picker
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 4,
  },
  timeColumn: {
    alignItems: 'center',
    width: 56,
  },
  timeArrow: {
    padding: 6,
  },
  timeDigit: {
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 2,
  },

  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  deleteBtnText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
});
