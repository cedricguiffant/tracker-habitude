import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions. Call once on app launch.
 * Returns true if granted.
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    // Notifications don't work on simulators/emulators
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Set up the Android notification channel (required for Android 8+).
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
}

/**
 * Schedule a daily notification for a habit.
 *
 * @param {string} habitId   - unique habit id (used as notification identifier)
 * @param {string} habitName - displayed in the notification body
 * @param {number} hour      - hour (0-23)
 * @param {number} minute    - minute (0-59)
 * @returns {string} notification identifier
 */
export async function scheduleDailyReminder(habitId, habitName, hour, minute) {
  // Cancel any existing reminder for this habit first
  await cancelReminder(habitId);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'PixelHabit Reminder',
      body: `Time to check in: ${habitName}`,
      data: { habitId },
      ...(Platform.OS === 'android' && { channelId: 'habit-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: habitId,
  });

  return id;
}

/**
 * Cancel a scheduled reminder for a habit.
 */
export async function cancelReminder(habitId) {
  await Notifications.cancelScheduledNotificationAsync(habitId);
}

/**
 * Cancel all scheduled reminders.
 */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Parse a "HH:MM" string into { hour, minute }.
 */
export function parseTimeString(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h, minute: m };
}

/**
 * Format hour/minute into "HH:MM" display string.
 */
export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
