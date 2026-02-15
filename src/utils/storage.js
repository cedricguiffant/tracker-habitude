import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = '@pixelhabit_habits';

export async function loadHabits() {
  const json = await AsyncStorage.getItem(HABITS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}
