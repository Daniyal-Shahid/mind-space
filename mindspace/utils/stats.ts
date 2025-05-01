import { MoodEntry as MoodEntryType } from "@/config/supabase";

// Types for calculating statistics
type Mood = "great" | "good" | "neutral" | "bad" | "awful";

// Assign numerical values to moods for calculations
const moodValues: Record<Mood, number> = {
  great: 5,
  good: 4,
  neutral: 3,
  bad: 2,
  awful: 1,
};

// Interface for the combined entry data
export interface CombinedEntry {
  date: string;
  mood?: Mood;
  moodValue?: number;
  sleepHours?: number;
  sleepQuality?: number;
  waterCups?: number;
  mealCount?: number;
  hasGratitude?: boolean;
  gratitudeItemCount?: number;
}

/**
 * Combine entries from different tables by date
 */
export function combineDailyEntries(
  moodEntries: MoodEntryType[],
  sleepEntries: any[],
  waterEntries: any[],
  foodEntries: any[],
  gratitudeEntries: any[]
): CombinedEntry[] {
  const entriesByDate: Record<string, CombinedEntry> = {};

  // Process mood entries
  if (Array.isArray(moodEntries)) {
    moodEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = { date: entry.date };
      }
      entriesByDate[entry.date].mood = entry.mood as Mood;
      entriesByDate[entry.date].moodValue = moodValues[entry.mood as Mood];
    });
  }

  // Process sleep entries
  if (Array.isArray(sleepEntries)) {
    sleepEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = { date: entry.date };
      }
      entriesByDate[entry.date].sleepHours = entry.hours_slept;
      entriesByDate[entry.date].sleepQuality = entry.sleep_quality;
    });
  }

  // Process water entries
  if (Array.isArray(waterEntries)) {
    waterEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = { date: entry.date };
      }
      entriesByDate[entry.date].waterCups = entry.cups;
    });
  }

  // Process food entries
  if (Array.isArray(foodEntries)) {
    foodEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = { date: entry.date };
      }
      // Calculate meal count by splitting the meals string
      entriesByDate[entry.date].mealCount = entry.meals
        ? entry.meals.split(",").length
        : 0;
    });
  }

  // Process gratitude entries
  if (Array.isArray(gratitudeEntries)) {
    gratitudeEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = { date: entry.date };
      }
      entriesByDate[entry.date].hasGratitude = true;
      entriesByDate[entry.date].gratitudeItemCount = entry.gratitude_items
        ? entry.gratitude_items.split("\n").filter((line: string) => line.trim()).length
        : 0;
    });
  }

  // Convert to array and sort by date
  return Object.values(entriesByDate).sort((a, b) => 
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );
}

/**
 * Calculate correlation between mood and sleep hours
 */
export function calculateMoodSleepCorrelation(combinedEntries: CombinedEntry[]) {
  const entriesWithBoth = combinedEntries.filter(
    (entry) => entry.moodValue !== undefined && entry.sleepHours !== undefined
  );

  if (entriesWithBoth.length < 5) {
    return {
      hasEnoughData: false,
      correlation: 0,
      optimalSleepHours: 0,
      bestMoodAfterSleep: null,
    };
  }

  // Group entries by sleep hours and find the highest average mood
  const sleepGroups: Record<string, number[]> = {};
  
  entriesWithBoth.forEach((entry) => {
    const hoursRounded = Math.round(entry.sleepHours!);
    if (!sleepGroups[hoursRounded]) {
      sleepGroups[hoursRounded] = [];
    }
    sleepGroups[hoursRounded].push(entry.moodValue!);
  });

  // Calculate average mood for each sleep hour group
  const sleepMoodAverages: { hours: number; avgMood: number; count: number }[] = [];
  
  Object.entries(sleepGroups).forEach(([hours, moods]) => {
    if (moods.length > 0) {
      const average = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
      sleepMoodAverages.push({
        hours: parseInt(hours),
        avgMood: average,
        count: moods.length,
      });
    }
  });

  // Find the optimal sleep duration
  const optimalSleep = sleepMoodAverages.length > 0
    ? sleepMoodAverages.reduce((best, current) => 
        current.avgMood > best.avgMood ? current : best
      )
    : { hours: 0, avgMood: 0, count: 0 };

  // Find the best mood after specific sleep hours
  const bestMoodEntry = entriesWithBoth.reduce(
    (best, current) => {
      if (current.moodValue! > best.moodValue! ||
        (current.moodValue === best.moodValue && current.sleepHours! > best.sleepHours!)) {
        return current;
      }
      return best;
    },
    entriesWithBoth[0]
  );

  // Calculate a simple correlation coefficient
  // (this is a simplified approach - for true correlation, use Pearson's r)
  let correlation = 0;
  if (entriesWithBoth.length >= 5) {
    const moodValues = entriesWithBoth.map((e) => e.moodValue!);
    const sleepValues = entriesWithBoth.map((e) => e.sleepHours!);
    
    // Calculate means
    const moodMean = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    const sleepMean = sleepValues.reduce((sum, val) => sum + val, 0) / sleepValues.length;
    
    // Calculate variances
    const moodVariance = moodValues.reduce((sum, val) => sum + Math.pow(val - moodMean, 2), 0);
    const sleepVariance = sleepValues.reduce((sum, val) => sum + Math.pow(val - sleepMean, 2), 0);
    
    // Calculate covariance
    let covariance = 0;
    for (let i = 0; i < entriesWithBoth.length; i++) {
      covariance += (moodValues[i] - moodMean) * (sleepValues[i] - sleepMean);
    }
    
    // Calculate correlation coefficient
    correlation = covariance / Math.sqrt(moodVariance * sleepVariance);
    
    // Handle NaN (when there's no variance)
    if (isNaN(correlation)) correlation = 0;
  }

  return {
    hasEnoughData: entriesWithBoth.length >= 5,
    correlation,
    optimalSleepHours: optimalSleep.hours,
    bestMoodAfterSleep: bestMoodEntry,
    dataPoints: entriesWithBoth.map(entry => ({
      date: entry.date,
      mood: entry.mood,
      moodValue: entry.moodValue,
      sleepHours: entry.sleepHours
    })),
    averages: sleepMoodAverages
  };
}

/**
 * Calculate correlation between mood and water intake
 */
export function calculateMoodWaterCorrelation(combinedEntries: CombinedEntry[]) {
  const entriesWithBoth = combinedEntries.filter(
    (entry) => entry.moodValue !== undefined && entry.waterCups !== undefined
  );

  if (entriesWithBoth.length < 5) {
    return {
      hasEnoughData: false,
      correlation: 0,
      optimalWaterCups: 0,
      bestMoodAfterWater: null,
    };
  }

  // Group entries by water cups and find the highest average mood
  const waterGroups: Record<string, number[]> = {};
  
  entriesWithBoth.forEach((entry) => {
    const cups = entry.waterCups!;
    if (!waterGroups[cups]) {
      waterGroups[cups] = [];
    }
    waterGroups[cups].push(entry.moodValue!);
  });

  // Calculate average mood for each water cup group
  const waterMoodAverages: { cups: number; avgMood: number; count: number }[] = [];
  
  Object.entries(waterGroups).forEach(([cups, moods]) => {
    if (moods.length > 0) {
      const average = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
      waterMoodAverages.push({
        cups: parseInt(cups),
        avgMood: average,
        count: moods.length,
      });
    }
  });

  // Find the optimal water intake
  const optimalWater = waterMoodAverages.length > 0
    ? waterMoodAverages.reduce((best, current) => 
        current.avgMood > best.avgMood ? current : best
      )
    : { cups: 0, avgMood: 0, count: 0 };

  // Find the best mood after specific water intake
  const bestMoodEntry = entriesWithBoth.reduce(
    (best, current) => {
      if (current.moodValue! > best.moodValue! ||
        (current.moodValue === best.moodValue && current.waterCups! > best.waterCups!)) {
        return current;
      }
      return best;
    },
    entriesWithBoth[0]
  );

  // Calculate a simple correlation coefficient
  let correlation = 0;
  if (entriesWithBoth.length >= 5) {
    const moodValues = entriesWithBoth.map((e) => e.moodValue!);
    const waterValues = entriesWithBoth.map((e) => e.waterCups!);
    
    // Calculate means
    const moodMean = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    const waterMean = waterValues.reduce((sum, val) => sum + val, 0) / waterValues.length;
    
    // Calculate variances
    const moodVariance = moodValues.reduce((sum, val) => sum + Math.pow(val - moodMean, 2), 0);
    const waterVariance = waterValues.reduce((sum, val) => sum + Math.pow(val - waterMean, 2), 0);
    
    // Calculate covariance
    let covariance = 0;
    for (let i = 0; i < entriesWithBoth.length; i++) {
      covariance += (moodValues[i] - moodMean) * (waterValues[i] - waterMean);
    }
    
    // Calculate correlation coefficient
    correlation = covariance / Math.sqrt(moodVariance * waterVariance);
    
    // Handle NaN (when there's no variance)
    if (isNaN(correlation)) correlation = 0;
  }

  return {
    hasEnoughData: entriesWithBoth.length >= 5,
    correlation,
    optimalWaterCups: optimalWater.cups,
    bestMoodAfterWater: bestMoodEntry,
    dataPoints: entriesWithBoth.map(entry => ({
      date: entry.date,
      mood: entry.mood,
      moodValue: entry.moodValue,
      waterCups: entry.waterCups
    })),
    averages: waterMoodAverages
  };
}

/**
 * Calculate correlation between mood and having gratitude entries
 */
export function calculateGratitudeImpact(combinedEntries: CombinedEntry[]) {
  // We need at least a week of data (7 entries) with some with and some without gratitude
  const entriesWithMood = combinedEntries.filter(
    (entry) => entry.moodValue !== undefined
  );
  
  const gratitudeDays = entriesWithMood.filter(entry => entry.hasGratitude);
  const nonGratitudeDays = entriesWithMood.filter(entry => !entry.hasGratitude);

  if (entriesWithMood.length < 7 || gratitudeDays.length === 0 || nonGratitudeDays.length === 0) {
    return {
      hasEnoughData: false,
      impact: 0,
      avgMoodWithGratitude: 0,
      avgMoodWithoutGratitude: 0,
    };
  }

  // Calculate average mood on days with gratitude vs days without
  const avgMoodWithGratitude = gratitudeDays.reduce(
    (sum, entry) => sum + entry.moodValue!, 0
  ) / gratitudeDays.length;

  const avgMoodWithoutGratitude = nonGratitudeDays.reduce(
    (sum, entry) => sum + entry.moodValue!, 0
  ) / nonGratitudeDays.length;

  // Calculate the impact (difference)
  const impact = avgMoodWithGratitude - avgMoodWithoutGratitude;

  return {
    hasEnoughData: true,
    impact,
    avgMoodWithGratitude,
    avgMoodWithoutGratitude,
    withGratitudeDays: gratitudeDays.length,
    withoutGratitudeDays: nonGratitudeDays.length,
    dataPoints: {
      withGratitude: gratitudeDays.map(entry => ({
        date: entry.date,
        mood: entry.mood,
        moodValue: entry.moodValue,
        itemCount: entry.gratitudeItemCount
      })),
      withoutGratitude: nonGratitudeDays.map(entry => ({
        date: entry.date,
        mood: entry.mood,
        moodValue: entry.moodValue
      }))
    }
  };
}

/**
 * Find correlations between meals and mood
 */
export function analyzeMealImpact(combinedEntries: CombinedEntry[], foodEntries: any[]) {
  // We need at least 2 weeks of food and mood data
  const entriesWithBoth = combinedEntries.filter(
    (entry) => entry.moodValue !== undefined && entry.mealCount !== undefined && entry.mealCount > 0
  );

  if (entriesWithBoth.length < 14) {
    return {
      hasEnoughData: false,
      mealPatterns: [],
    };
  }

  // Extract all unique meal names from food entries
  const allMeals = new Set<string>();
  const mealToMoods: Record<string, number[]> = {};
  
  // Process each food entry with a mood
  foodEntries.forEach(foodEntry => {
    const date = foodEntry.date;
    const combinedEntry = entriesWithBoth.find(e => e.date === date);
    
    if (combinedEntry && combinedEntry.moodValue !== undefined) {
      const meals = foodEntry.meals.split(',').map((m: string) => m.trim().toLowerCase());
      
      meals.forEach((meal: string) => {
        allMeals.add(meal);
        
        if (!mealToMoods[meal]) {
          mealToMoods[meal] = [];
        }
        
        mealToMoods[meal].push(combinedEntry.moodValue!);
      });
    }
  });

  // Calculate average mood for each meal
  const mealPatterns = Array.from(allMeals).map(meal => {
    const moods = mealToMoods[meal] || [];
    const avgMood = moods.length > 0 
      ? moods.reduce((sum, mood) => sum + mood, 0) / moods.length
      : 0;
      
    return {
      meal,
      occurrences: moods.length,
      avgMood,
    };
  });

  // Sort by average mood (highest first)
  mealPatterns.sort((a, b) => b.avgMood - a.avgMood);

  return {
    hasEnoughData: true,
    mealPatterns: mealPatterns.filter(m => m.occurrences >= 3), // Only include meals with at least 3 occurrences
  };
} 