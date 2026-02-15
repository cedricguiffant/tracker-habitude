import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = '@pixelhabit_habits';

/**
 * Habit shape:
 * {
 *   id: string,          // unique identifier (uuid)
 *   name: string,        // e.g. "Méditation"
 *   color: string,       // hex e.g. "#6C63FF"
 *   type: "positive" | "negative",
 *   createdAt: string,   // ISO 8601 date
 *   checkIns: string[],  // array of ISO date strings ("2026-02-15")
 * }
 */

export async function getHabits() {
  const json = await AsyncStorage.getItem(HABITS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export async function addCheckIn(habitId, date) {
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return habits;

  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

  if (!habit.checkIns.includes(dateStr)) {
    habit.checkIns.push(dateStr);
  }

  await saveHabits(habits);
  return habits;
}

export async function removeCheckIn(habitId, date) {
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return habits;

  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  habit.checkIns = habit.checkIns.filter((d) => d !== dateStr);

  await saveHabits(habits);
  return habits;
}
