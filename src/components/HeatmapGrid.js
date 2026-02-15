import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  format,
  startOfWeek,
  differenceInCalendarWeeks,
  isAfter,
} from 'date-fns';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Map JS getDay (0=Sun) to row index (0=Mon)
const JS_DAY_TO_ROW = [6, 0, 1, 2, 3, 4, 5];

const INTENSITY_COLORS = {
  light: ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'],
  dark: ['#2D333B', '#0E4429', '#006D32', '#26A641', '#39D353'],
};

function getIntensityLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export default function HeatmapGrid({
  checkIns = [],
  year,
  color,
  onDayPress,
  weekStartsOn = 1, // 1 = Monday
}) {
  const { dark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const displayYear = year ?? new Date().getFullYear();

  // Build a Set of date strings for O(1) lookup and a count map
  const checkInCounts = useMemo(() => {
    const counts = {};
    for (const dateStr of checkIns) {
      const day = dateStr.slice(0, 10); // "YYYY-MM-DD"
      counts[day] = (counts[day] || 0) + 1;
    }
    return counts;
  }, [checkIns]);

  // Build grid data: compute all weeks/days for the year
  const { weeks, totalWeeks } = useMemo(() => {
    const janFirst = startOfYear(new Date(displayYear, 0, 1));
    const decLast = endOfYear(new Date(displayYear, 0, 1));
    const today = new Date();

    const weekStart = startOfWeek(janFirst, { weekStartsOn });
    const numWeeks =
      differenceInCalendarWeeks(decLast, weekStart, { weekStartsOn }) + 1;

    const allDays = eachDayOfInterval({ start: janFirst, end: decLast });
    const dayMap = {};
    for (const d of allDays) {
      dayMap[format(d, 'yyyy-MM-dd')] = d;
    }

    const result = [];
    for (let w = 0; w < numWeeks; w++) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        // Compute the date for this cell
        const dayOffset = w * 7 + row;
        const cellDate = new Date(weekStart);
        cellDate.setDate(weekStart.getDate() + dayOffset);

        const dateStr = format(cellDate, 'yyyy-MM-dd');
        const inYear = cellDate.getFullYear() === displayYear;
        const inFuture = isAfter(cellDate, today);

        week.push({
          date: dateStr,
          count: checkInCounts[dateStr] || 0,
          inYear,
          inFuture,
        });
      }
      result.push(week);
    }

    return { weeks: result, totalWeeks: numWeeks };
  }, [displayYear, checkInCounts, weekStartsOn]);

  // Compute responsive pixel size
  // Layout: labelWidth + totalWeeks * (pixelSize + gap) + padding
  const LABEL_WIDTH = 28;
  const HORIZONTAL_PADDING = 16;
  const GAP = 2;
  const availableWidth = screenWidth - LABEL_WIDTH - HORIZONTAL_PADDING * 2;
  const pixelSize = Math.max(
    2,
    Math.floor((availableWidth - GAP * (totalWeeks - 1)) / totalWeeks)
  );

  // Color palette: use custom color or default green
  const palette = useMemo(() => {
    if (!color) return dark ? INTENSITY_COLORS.dark : INTENSITY_COLORS.light;

    // Generate shades from the provided hex color
    const base = dark ? INTENSITY_COLORS.dark : INTENSITY_COLORS.light;
    const empty = base[0]; // keep empty cell color from theme
    return [empty, color + '44', color + '88', color + 'CC', color];
  }, [color, dark]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      // Find first in-year day in this week
      const inYearDay = weeks[w].find((d) => d.inYear);
      if (!inYearDay) continue;
      const month = new Date(inYearDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex: w, label: format(new Date(displayYear, month), 'MMM') });
        lastMonth = month;
      }
    }
    return labels;
  }, [weeks, displayYear]);

  return (
    <View style={styles.container}>
      {/* Month labels row */}
      <View style={[styles.monthRow, { marginLeft: LABEL_WIDTH }]}>
        {monthLabels.map(({ weekIndex, label }) => (
          <Text
            key={label + weekIndex}
            style={[
              styles.monthLabel,
              {
                left: weekIndex * (pixelSize + GAP),
                color: dark ? '#8B949E' : '#666666',
                fontSize: Math.max(8, Math.min(11, pixelSize)),
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.gridWrapper}>
        {/* Day labels */}
        <View style={[styles.dayLabels, { width: LABEL_WIDTH }]}>
          {DAY_LABELS.map((label, i) => (
            <View
              key={label}
              style={{
                height: pixelSize,
                marginBottom: GAP,
                justifyContent: 'center',
              }}
            >
              {i % 2 === 0 ? (
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: dark ? '#8B949E' : '#999999',
                      fontSize: Math.max(7, Math.min(10, pixelSize)),
                    },
                  ]}
                >
                  {label}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Pixel grid: columns = weeks, rows = days */}
        <View style={styles.grid}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={[styles.weekColumn, { marginRight: GAP }]}>
              {week.map((day) => {
                if (!day.inYear) {
                  return (
                    <View
                      key={day.date}
                      style={{
                        width: pixelSize,
                        height: pixelSize,
                        marginBottom: GAP,
                      }}
                    />
                  );
                }

                const level = day.inFuture ? 0 : getIntensityLevel(day.count);
                const bgColor = palette[level];

                return (
                  <TouchableOpacity
                    key={day.date}
                    activeOpacity={0.7}
                    onPress={() => onDayPress?.(day.date)}
                    style={[
                      styles.pixel,
                      {
                        width: pixelSize,
                        height: pixelSize,
                        marginBottom: GAP,
                        backgroundColor: bgColor,
                        borderRadius: Math.max(1, Math.floor(pixelSize / 5)),
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  monthRow: {
    height: 16,
    position: 'relative',
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  dayLabels: {
    justifyContent: 'flex-start',
  },
  dayLabel: {
    textAlign: 'right',
    paddingRight: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  weekColumn: {
    flexDirection: 'column',
  },
  pixel: {
    overflow: 'hidden',
  },
});
