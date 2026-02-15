import { format, subDays, parseISO } from 'date-fns';

/**
 * Compute the current streak for a habit (consecutive days ending today or yesterday).
 */
export function getCurrentStreak(checkIns) {
  if (!checkIns || checkIns.length === 0) return 0;

  const sorted = [...checkIns].sort().reverse(); // most recent first
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expected = format(subDays(parseISO(sorted[i - 1]), 1), 'yyyy-MM-dd');
    if (sorted[i] === expected) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Count unique days with at least one check-in across all habits.
 */
export function getTotalActiveDays(habits) {
  const allDays = new Set();
  for (const habit of habits) {
    for (const d of habit.checkIns) {
      allDays.add(d);
    }
  }
  return allDays.size;
}

/**
 * Merge all check-ins from all habits into a single flat array.
 */
export function getAllCheckIns(habits) {
  const all = [];
  for (const habit of habits) {
    for (const d of habit.checkIns) {
      all.push(d);
    }
  }
  return all;
}

/**
 * Best streak ever across a single habit's check-ins.
 */
export function getBestStreak(checkIns) {
  if (!checkIns || checkIns.length === 0) return 0;

  const sorted = [...new Set(checkIns)].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const expected = format(subDays(parseISO(sorted[i]), 1), 'yyyy-MM-dd');
    if (sorted[i - 1] === expected) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

/**
 * Check if a habit has been checked in today.
 */
export function isCheckedToday(checkIns) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return checkIns.includes(today);
}

/**
 * Generate a simple UUID v4.
 */
export function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}
