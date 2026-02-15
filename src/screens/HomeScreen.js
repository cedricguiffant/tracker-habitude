import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getHabits, addCheckIn, removeCheckIn, saveHabits } from '../utils/storage';
import {
  getCurrentStreak,
  getTotalActiveDays,
  getAllCheckIns,
  isCheckedToday,
  generateId,
} from '../utils/habits';
import HeatmapGrid from '../components/HeatmapGrid';
import AddHabitModal from '../components/AddHabitModal';

export default function HomeScreen() {
  const { colors, dark } = useTheme();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null); // null = global view

  // Reload habits every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHabits().then((data) => {
        if (active) {
          setHabits(data);
          setLoading(false);
        }
      });
      return () => { active = false; };
    }, [])
  );

  const today = format(new Date(), 'yyyy-MM-dd');

  // --- Actions ---

  async function handleToggleCheckIn(habit) {
    const checked = isCheckedToday(habit.checkIns);
    const updated = checked
      ? await removeCheckIn(habit.id, today)
      : await addCheckIn(habit.id, today);
    setHabits(updated);
  }

  async function handleAddHabit({ name, color, type }) {
    const newHabit = {
      id: generateId(),
      name,
      color,
      type,
      createdAt: new Date().toISOString(),
      checkIns: [],
    };
    const updated = [...habits, newHabit];
    await saveHabits(updated);
    setHabits(updated);
    setModalVisible(false);
  }

  // --- Derived data ---

  const heatmapCheckIns =
    selectedHabitId === null
      ? getAllCheckIns(habits)
      : (habits.find((h) => h.id === selectedHabitId)?.checkIns ?? []);

  const heatmapColor =
    selectedHabitId === null
      ? null
      : habits.find((h) => h.id === selectedHabitId)?.color ?? null;

  const totalActiveDays = getTotalActiveDays(habits);
  const totalCheckIns = habits.reduce((sum, h) => sum + h.checkIns.length, 0);

  // --- Render ---

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.appTitle, { color: colors.text }]}>
                PixelHabit
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Stats bar */}
            <View
              style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <StatItem
                label="Active days"
                value={totalActiveDays}
                colors={colors}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatItem
                label="Total check-ins"
                value={totalCheckIns}
                colors={colors}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatItem
                label="Habits"
                value={habits.length}
                colors={colors}
              />
            </View>

            {/* Heatmap filter tabs */}
            <View style={styles.filterRow}>
              <FilterChip
                label="All"
                active={selectedHabitId === null}
                color={colors.primary}
                colors={colors}
                onPress={() => setSelectedHabitId(null)}
              />
              {habits.map((h) => (
                <FilterChip
                  key={h.id}
                  label={h.name}
                  active={selectedHabitId === h.id}
                  color={h.color}
                  colors={colors}
                  onPress={() => setSelectedHabitId(h.id)}
                />
              ))}
            </View>

            {/* Heatmap */}
            <HeatmapGrid
              checkIns={heatmapCheckIns}
              color={heatmapColor}
              onDayPress={(date) => {
                // Future: open day detail
              }}
            />

            {/* Section title */}
            {habits.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Today
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            colors={colors}
            dark={dark}
            onToggle={() => handleToggleCheckIn(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="add-circle-outline"
              size={56}
              color={colors.border}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tap + to add your first habit
            </Text>
          </View>
        }
      />

      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddHabit}
      />
    </View>
  );
}

// --- Sub-components ---

function StatItem({ label, value, colors }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function FilterChip({ label, active, color, colors, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? color : colors.card,
          borderColor: active ? color : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: active ? '#FFFFFF' : colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HabitRow({ habit, colors, dark, onToggle }) {
  const checked = isCheckedToday(habit.checkIns);
  const streak = getCurrentStreak(habit.checkIns);

  return (
    <View
      style={[
        styles.habitRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Color indicator */}
      <View style={[styles.colorBar, { backgroundColor: habit.color }]} />

      <View style={styles.habitInfo}>
        <Text style={[styles.habitName, { color: colors.text }]}>
          {habit.name}
        </Text>
        <View style={styles.streakRow}>
          <Ionicons
            name="flame"
            size={14}
            color={streak > 0 ? '#FF6B6B' : colors.textSecondary}
          />
          <Text
            style={[
              styles.streakText,
              { color: streak > 0 ? '#FF6B6B' : colors.textSecondary },
            ]}
          >
            {streak} day{streak !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Check-in button */}
      <TouchableOpacity onPress={onToggle} style={styles.checkBtn}>
        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: checked ? habit.color : 'transparent',
              borderColor: checked
                ? habit.color
                : dark
                  ? '#555'
                  : '#CCC',
            },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },

  // Habit row
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  habitInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Check-in button
  checkBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
