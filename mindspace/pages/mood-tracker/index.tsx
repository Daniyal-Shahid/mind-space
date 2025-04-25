import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";

import { fetchMoodEntries } from "@/utils/mood";
import { 
  fetchSleepEntries,
  fetchFoodEntries,
  fetchWaterEntries,
  fetchGratitudeEntries
} from "@/utils/entries";
import { MoodEntry as MoodEntryType } from "@/config/supabase";
import MoodPopup from "@/components/mood-tracker/mood-popup";
import CalendarPopup from "@/components/mood-tracker/calendar-popup";
import MoodStatistics from "@/components/stats/MoodStatistics";

// Mood types
type Mood = "great" | "good" | "neutral" | "bad" | "awful";

// Entry types with mood and note
interface MoodEntry {
  id?: string; // Add ID for existing entries
  mood: Mood; // Mood type
  note?: string; // Note for the mood entry
}

// Additional entry types
interface SleepEntry {
  id?: string;
  hours_slept: number;
  sleep_quality: number;
}

interface FoodEntry {
  id?: string;
  meals: string;
  feeling_after?: string;
}

interface WaterEntry {
  id?: string;
  cups: number;
}

interface GratitudeEntry {
  id?: string;
  gratitude_items: string;
}

// Sample mood data as fallback
const initialMoodData: Record<string, MoodEntry> = {};

// Mood descriptions for tooltips
const moodDescriptions: Record<Mood, string> = {
  great: "Feeling amazing - energetic, joyful, and accomplished",
  good: "Feeling positive - content and calm",
  neutral: "Feeling okay - neither good nor bad",
  bad: "Feeling down - sad, tired, or stressed",
  awful: "Feeling terrible - extremely upset or distressed",
};

// Mood colours and text colours for different modes
const moodStyles: Record<Mood, { bgClass: string; lightText: boolean }> = {
  great: { bgClass: "bg-pastel-green", lightText: false },
  good: { bgClass: "bg-pastel-blue", lightText: false },
  neutral: { bgClass: "bg-pastel-yellow", lightText: false },
  bad: { bgClass: "bg-pastel-orange", lightText: false },
  awful: { bgClass: "bg-pastel-pink", lightText: false },
};

// MoodTooltip component
const MoodTooltip = ({ mood, note }: { mood: Mood; note?: string }) => {
  const moodStyle = moodStyles[mood];
  const textColourClass = moodStyle.lightText
    ? "text-white"
    : "text-default-900";

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 ${moodStyle.bgClass} ${textColourClass} rounded-md px-3 py-2 text-sm shadow-lg min-w-[180px] max-w-[250px] border border-default-200/30`}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div className="font-medium mb-1">
        <span className="font-semibold">Feeling:</span>{" "}
        <span className="capitalize">{mood}</span>
      </div>
      <div
        className={`text-xs ${moodStyle.lightText ? "opacity-90" : "text-default-700"}`}
      >
        <span className="font-semibold">Description:</span>{" "}
        {moodDescriptions[mood]}
      </div>
      {note && (
        <div
          className={`text-xs mt-1 pt-1 border-t border-default-200/30 ${moodStyle.lightText ? "opacity-90" : "text-default-700"}`}
        >
          <span className="font-semibold">Notes:</span> {note}
        </div>
      )}
    </motion.div>
  );
};

export default function MoodTracker() {
  const today = new Date();
  const [displayDate, setDisplayDate] = useState<Date>(today);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Mood state
  const [moodData, setMoodData] = useState<Record<string, MoodEntry>>(initialMoodData);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [noteText, setNoteText] = useState("");
  const [entryId, setEntryId] = useState<string | undefined>(undefined);
  
  // Additional entries state
  const [sleepData, setSleepData] = useState<Record<string, SleepEntry>>({});
  const [foodData, setFoodData] = useState<Record<string, FoodEntry>>({});
  const [waterData, setWaterData] = useState<Record<string, WaterEntry>>({});
  const [gratitudeData, setGratitudeData] = useState<Record<string, GratitudeEntry>>({});
  
  const [selectedSleepEntry, setSelectedSleepEntry] = useState<SleepEntry | null>(null);
  const [selectedFoodEntry, setSelectedFoodEntry] = useState<FoodEntry | null>(null);
  const [selectedWaterEntry, setSelectedWaterEntry] = useState<WaterEntry | null>(null);
  const [selectedGratitudeEntry, setSelectedGratitudeEntry] = useState<GratitudeEntry | null>(null);
  
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  // Cache whether today's mood is set, so it doesn't change when navigating months
  const [hasTodaysMood, setHasTodaysMood] = useState(false);

  // Format today's date as YYYY-MM-DD for comparison
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Load mood entries from Supabase
  useEffect(() => {
    async function loadEntries() {
      try {
        setIsLoading(true);
        setError(null);

        // Get the first and last day of the displayed month
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Format dates for API
        const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

        // Fetch all entries for the current month
        const [moodEntries, sleepEntries, foodEntries, waterEntries, gratitudeEntries] = await Promise.all([
          fetchMoodEntries({ startDate, endDate }),
          fetchSleepEntries({ startDate, endDate }),
          fetchFoodEntries({ startDate, endDate }),
          fetchWaterEntries({ startDate, endDate }),
          fetchGratitudeEntries({ startDate, endDate })
        ]);

        // Process mood entries
        const newMoodData: Record<string, MoodEntry> = {};
        moodEntries.forEach((entry: MoodEntryType) => {
          // Validate that the mood is one of our accepted types
          if (["great", "good", "neutral", "bad", "awful"].includes(entry.mood)) {
            newMoodData[entry.date] = {
              id: entry.id, // Store the ID for update operations
              mood: entry.mood as Mood,
              note: entry.note || undefined,
            };
          }
        });
        setMoodData(newMoodData);

        // Process sleep entries
        const newSleepData: Record<string, SleepEntry> = {};
        sleepEntries.forEach((entry: any) => {
          newSleepData[entry.date] = {
            id: entry.id,
            hours_slept: entry.hours_slept,
            sleep_quality: entry.sleep_quality
          };
        });
        setSleepData(newSleepData);
        
        // Process food entries
        const newFoodData: Record<string, FoodEntry> = {};
        foodEntries.forEach((entry: any) => {
          newFoodData[entry.date] = {
            id: entry.id,
            meals: entry.meals,
            feeling_after: entry.feeling_after
          };
        });
        setFoodData(newFoodData);
        
        // Process water entries
        const newWaterData: Record<string, WaterEntry> = {};
        waterEntries.forEach((entry: any) => {
          newWaterData[entry.date] = {
            id: entry.id,
            cups: entry.cups
          };
        });
        setWaterData(newWaterData);
        
        // Process gratitude entries
        const newGratitudeData: Record<string, GratitudeEntry> = {};
        gratitudeEntries.forEach((entry: any) => {
          newGratitudeData[entry.date] = {
            id: entry.id,
            gratitude_items: entry.gratitude_items
          };
        });
        setGratitudeData(newGratitudeData);
        
      } catch (err) {
        console.error("Error loading entries:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load entries",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEntries();
  }, [displayDate]);

  // Check for today's mood when the component mounts and when moodData changes
  useEffect(() => {
    const checkTodaysMood = async () => {
      try {
        // Only fetch today's mood if we haven't already determined it
        if (!hasTodaysMood) {
          const entries = await fetchMoodEntries({
            startDate: todayStr,
            endDate: todayStr,
          });

          setHasTodaysMood(entries.length > 0);
        }
      } catch (err) {
        console.error("Error checking today's mood:", err);
      }
    };

    checkTodaysMood();
  }, [moodData, todayStr, hasTodaysMood]);

  // Get current month and year
  const monthName = displayDate.toLocaleString("en-GB", { month: "long" });
  const year = displayDate.getFullYear();

  // Check if this is the current month
  const isCurrentMonth =
    displayDate.getMonth() === today.getMonth() &&
    displayDate.getFullYear() === today.getFullYear();

  // Check if at the earliest allowed date (Jan 2025)
  const isEarliestAllowedDate =
    displayDate.getMonth() === 0 && displayDate.getFullYear() === 2025;

  // Get days in month
  const daysInMonth = new Date(year, displayDate.getMonth() + 1, 0).getDate();

  // Get first day of month
  const firstDayOfMonth = new Date(year, displayDate.getMonth(), 1).getDay();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(displayDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const moodEntry = moodData[dateStr];

    // Check if date is in the future
    const isFutureDate = new Date(dateStr) > today;

    // Check if date is today
    const isToday = dateStr === todayStr;

    calendarDays.push({
      day,
      moodEntry,
      dateStr,
      isFutureDate,
      isToday,
    });
  }

  // Handle navigation to previous month
  const handlePrevMonth = () => {
    if (isEarliestAllowedDate) return;

    setSlideDirection("right");
    const newDate = new Date(displayDate);

    newDate.setMonth(newDate.getMonth() - 1);
    setDisplayDate(newDate);
  };

  // Handle navigation to next month
  const handleNextMonth = () => {
    if (isCurrentMonth) return;

    setSlideDirection("left");
    const newDate = new Date(displayDate);

    newDate.setMonth(newDate.getMonth() + 1);
    setDisplayDate(newDate);
  };

  // Handle day click to open modal with the selected date
  const handleDayClick = (date: string) => {
    // Don't allow selecting future dates
    if (new Date(date) > today) return;

    // Get the current mood data for the selected date
    const existingMoodEntry = moodData[date];
    const existingSleepEntry = sleepData[date];
    const existingFoodEntry = foodData[date];
    const existingWaterEntry = waterData[date];
    const existingGratitudeEntry = gratitudeData[date];

    // Set the selected date first
    setSelectedDate(date);

    // Then set the mood and note if an entry exists
    if (existingMoodEntry) {
      setSelectedMood(existingMoodEntry.mood);
      setNoteText(existingMoodEntry.note || "");
      setEntryId(existingMoodEntry.id);
    } else {
      setSelectedMood(null);
      setNoteText("");
      setEntryId(undefined);
    }
    
    // Set additional entries if they exist
    setSelectedSleepEntry(existingSleepEntry || null);
    setSelectedFoodEntry(existingFoodEntry || null);
    setSelectedWaterEntry(existingWaterEntry || null);
    setSelectedGratitudeEntry(existingGratitudeEntry || null);

    // Finally, open the popup
    setShowMoodPopup(true);
  };

  // Handle the Add/Update Today's Mood button click
  const handleTodayMoodClick = () => {
    const existingMoodEntry = moodData[todayStr];
    const existingSleepEntry = sleepData[todayStr];
    const existingFoodEntry = foodData[todayStr];
    const existingWaterEntry = waterData[todayStr];
    const existingGratitudeEntry = gratitudeData[todayStr];

    // Set the selected date first
    setSelectedDate(todayStr);

    // Then set the mood and note if an entry exists
    if (existingMoodEntry) {
      setSelectedMood(existingMoodEntry.mood);
      setNoteText(existingMoodEntry.note || "");
      setEntryId(existingMoodEntry.id);
    } else {
      setSelectedMood(null);
      setNoteText("");
      setEntryId(undefined);
    }
    
    // Set additional entries if they exist
    setSelectedSleepEntry(existingSleepEntry || null);
    setSelectedFoodEntry(existingFoodEntry || null);
    setSelectedWaterEntry(existingWaterEntry || null);
    setSelectedGratitudeEntry(existingGratitudeEntry || null);

    // Finally, open the popup
    setShowMoodPopup(true);
  };

  // Handle mood saved callback from popup
  const handleMoodSaved = (
    date: string,
    mood: Mood,
    note?: string,
    isUpdate?: boolean,
    sleepEntry?: any,
    foodEntry?: any,
    waterEntry?: any,
    gratitudeEntry?: any
  ) => {
    // Create copies of all the current data states
    const updatedMoodData = { ...moodData };
    const updatedSleepData = { ...sleepData };
    const updatedFoodData = { ...foodData };
    const updatedWaterData = { ...waterData };
    const updatedGratitudeData = { ...gratitudeData };

    // Update mood data for immediate UI feedback
    updatedMoodData[date] = {
      ...updatedMoodData[date],
      mood: mood,
      note: note,
    };

    // Update additional entry data if provided
    if (sleepEntry) {
      updatedSleepData[date] = sleepEntry;
    }
    
    if (foodEntry) {
      updatedFoodData[date] = foodEntry;
    }
    
    if (waterEntry) {
      updatedWaterData[date] = waterEntry;
    }
    
    if (gratitudeEntry) {
      updatedGratitudeData[date] = gratitudeEntry;
    }

    // Update all state variables
    setMoodData(updatedMoodData);
    setSleepData(updatedSleepData);
    setFoodData(updatedFoodData);
    setWaterData(updatedWaterData);
    setGratitudeData(updatedGratitudeData);

    // If today's date was updated, update the hasTodaysMood state
    if (date === todayStr) {
      setHasTodaysMood(true);
    }

    // Reset form state after saving
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
    setSelectedSleepEntry(null);
    setSelectedFoodEntry(null);
    setSelectedWaterEntry(null);
    setSelectedGratitudeEntry(null);
  };

  // Handle closing the mood popup
  const handleCloseMoodPopup = () => {
    setShowMoodPopup(false);
    // Reset state to avoid stale data
    setSelectedDate(null);
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
    setSelectedSleepEntry(null);
    setSelectedFoodEntry(null);
    setSelectedWaterEntry(null);
    setSelectedGratitudeEntry(null);
  };

  // Handle deleting mood
  const handleMoodDeleted = (date: string) => {
    // Create copies of all current data states
    const updatedMoodData = { ...moodData };
    const updatedSleepData = { ...sleepData };
    const updatedFoodData = { ...foodData };
    const updatedWaterData = { ...waterData };
    const updatedGratitudeData = { ...gratitudeData };

    // Remove all entries for this date from our local state
    if (updatedMoodData[date]) {
      delete updatedMoodData[date];
    }
    
    if (updatedSleepData[date]) {
      delete updatedSleepData[date];
    }
    
    if (updatedFoodData[date]) {
      delete updatedFoodData[date];
    }
    
    if (updatedWaterData[date]) {
      delete updatedWaterData[date]; 
    }
    
    if (updatedGratitudeData[date]) {
      delete updatedGratitudeData[date];
    }

    // Update all state variables
    setMoodData(updatedMoodData);
    setSleepData(updatedSleepData);
    setFoodData(updatedFoodData);
    setWaterData(updatedWaterData);
    setGratitudeData(updatedGratitudeData);

    // If today's date was deleted, update the hasTodaysMood state
    if (date === todayStr) {
      setHasTodaysMood(false);
    }

    // Reset state
    setSelectedDate(null);
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
    setSelectedSleepEntry(null);
    setSelectedFoodEntry(null);
    setSelectedWaterEntry(null);
    setSelectedGratitudeEntry(null);
  };

  // Animation variants for month transition
  const calendarVariants = {
    enter: (direction: string) => ({
      x: direction === "left" ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === "left" ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-default-900 mb-8">Mood Tracker</h1>

      {/* Error message if any */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-md">
          <p className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Today's mood action card */}
      <div className="mb-8 p-5 bg-default-50 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-default-900 mb-2">
          Today's Mood
        </h2>
        <p className="text-default-600 mb-4">
          {hasTodaysMood
            ? "You've recorded your mood for today. Would you like to update it?"
            : "How are you feeling today? Record your mood to track your emotional wellbeing."}
        </p>
        <Button
          color="primary"
          size="md"
          onPress={handleTodayMoodClick}
        >
          {hasTodaysMood ? "Update Todays Entries" : "Add Todays Entries"}
        </Button>
      </div>

      {/* Calendar section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-default-50 border-b border-default-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-default-900">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                aria-label="Previous Month"
                color="default"
                disabled={isEarliestAllowedDate}
                isIconOnly
                size="sm"
                variant="flat"
                onClick={handlePrevMonth}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>

              <button
                className="text-default-700 hover:text-primary hover:underline text-sm font-medium"
                onClick={() => setShowCalendarPopup(true)}
              >
                Select Month
              </button>

              <Button
                aria-label="Next Month"
                color="default"
                disabled={isCurrentMonth}
                isIconOnly
                size="sm"
                variant="flat"
                onClick={handleNextMonth}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-default-500 text-sm font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <AnimatePresence>
            <motion.div
              animate={{ x: 0, opacity: 1 }}
              className="grid grid-cols-7 gap-2"
              exit={{ x: slideDirection === "left" ? -20 : 20, opacity: 0 }}
              initial={{ x: slideDirection === "left" ? 20 : -20, opacity: 0 }}
              key={`${displayDate.getMonth()}-${displayDate.getFullYear()}`}
              transition={{ duration: 0.2 }}
            >
              {calendarDays.map((day, index) =>
                day === null ? (
                  <div key={`empty-${index}`} className="aspect-square" />
                ) : (
                  <motion.button
                    animate={
                      hoveredMood === day.dateStr
                        ? { scale: 1.05 }
                        : { scale: 1 }
                    }
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                      day.isToday
                        ? "ring-2 ring-primary ring-opacity-60"
                        : day.isFutureDate
                        ? "bg-default-100/50 cursor-not-allowed"
                        : day.moodEntry
                        ? "cursor-pointer"
                        : "bg-default-100 hover:bg-default-200 cursor-pointer"
                    }`}
                    disabled={day.isFutureDate}
                    initial={{ scale: 1 }}
                    key={day.dateStr}
                    transition={{ duration: 0.2 }}
                    whileHover={
                      !day.isFutureDate ? { scale: 1.05 } : undefined
                    }
                    onClick={() => handleDayClick(day.dateStr)}
                    onMouseEnter={() =>
                      day.moodEntry && setHoveredMood(day.dateStr)
                    }
                    onMouseLeave={() => setHoveredMood(null)}
                  >
                    {/* Day number */}
                    <span
                      className={`text-sm font-medium z-10 ${
                        day.moodEntry &&
                        moodStyles[day.moodEntry.mood].lightText
                          ? "text-white"
                          : "text-default-800"
                      }`}
                    >
                      {day.day}
                    </span>

                    {/* Mood indicator */}
                    {day.moodEntry && (
                      <motion.div
                        className={`absolute inset-0 ${
                          moodStyles[day.moodEntry.mood].bgClass
                        } rounded-lg`}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        layoutId={`mood-${day.dateStr}`}
                        transition={{ duration: 0.2 }}
                        animate={{ opacity: 1 }}
                      />
                    )}

                    {/* Info tooltip on hover */}
                    {hoveredMood === day.dateStr && day.moodEntry && (
                      <AnimatePresence>
                        <motion.div
                          key={`tooltip-${day.dateStr}`}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-default-900 text-white rounded-md px-3 py-2 text-xs shadow-lg min-w-[200px] max-w-[300px] z-20"
                          exit={{ opacity: 0, y: 10 }}
                          initial={{ opacity: 0, y: 10 }}
                        >
                          <div className="font-medium mb-1 capitalize border-b border-white/20 pb-1">
                            Mood: {day.moodEntry.mood}
                          </div>
                          {day.moodEntry.note && (
                            <div className="text-white/80 mb-1">
                              {day.moodEntry.note}
                            </div>
                          )}
                          
                          {/* Show additional entries if they exist */}
                          <div className="text-white/90 space-y-1 mt-2 text-[10px]">
                            {sleepData[day.dateStr] && (
                              <div className="flex items-center">
                                <span className="mr-1">💤</span>
                                <span>Sleep: {sleepData[day.dateStr].hours_slept}h, Quality: {sleepData[day.dateStr].sleep_quality}/10</span>
                              </div>
                            )}
                            
                            {waterData[day.dateStr] && (
                              <div className="flex items-center">
                                <span className="mr-1">💧</span>
                                <span>Water: {waterData[day.dateStr].cups} cup{waterData[day.dateStr].cups !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            
                            {foodData[day.dateStr] && (
                              <div className="flex items-center">
                                <span className="mr-1">🍽️</span>
                                <span>Food: {foodData[day.dateStr].meals.split(',').length} meals</span>
                              </div>
                            )}
                            
                            {gratitudeData[day.dateStr] && (
                              <div className="flex items-center">
                                <span className="mr-1">🙏</span>
                                <span>Gratitude: {gratitudeData[day.dateStr].gratitude_items.split('\n').filter((line: string) => line.trim()).length} item(s)</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-default-900"></div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.button>
                ),
              )}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {(["great", "good", "neutral", "bad", "awful"] as Mood[]).map(
              (mood) => (
                <div key={mood} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${moodStyles[mood].bgClass} mr-1`}
                  ></div>
                  <span className="text-xs text-default-600 capitalize">
                    {mood}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Mood Popup */}
      {showMoodPopup && selectedDate && (
        <MoodPopup
          entryId={entryId}
          initialMood={selectedMood}
          initialNote={noteText}
          initialSleepEntry={selectedSleepEntry}
          initialFoodEntry={selectedFoodEntry}
          initialWaterEntry={selectedWaterEntry}
          initialGratitudeEntry={selectedGratitudeEntry}
          isOpen={showMoodPopup}
          isToday={selectedDate === todayStr}
          selectedDate={selectedDate}
          onClose={handleCloseMoodPopup}
          onSaved={handleMoodSaved}
          onDeleted={handleMoodDeleted}
        />
      )}

      {/* Use the new CalendarPopup component */}
      <AnimatePresence>
        {showCalendarPopup && (
          <CalendarPopup
            key="calendar-popup"
            currentDate={displayDate}
            onClose={() => setShowCalendarPopup(false)}
            onSelectDate={setDisplayDate}
          />
        )}
      </AnimatePresence>
      
      {/* Wellbeing Statistics Section */}
      <MoodStatistics />
    </div>
  );
}
