import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";

import { fetchMoodEntries } from "@/utils/mood";
import { MoodEntry as MoodEntryType } from "@/config/supabase";
import MoodPopup from "@/components/mood-tracker/mood-popup";
import CalendarPopup from "@/components/mood-tracker/calendar-popup";

// Mood types
type Mood = "great" | "good" | "neutral" | "bad" | "awful";

// Entry types with mood and note
interface MoodEntry {
  id?: string; // Add ID for existing entries
  mood: Mood; // Mood type
  note?: string; // Note for the mood entry
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
  const [moodData, setMoodData] =
    useState<Record<string, MoodEntry>>(initialMoodData);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [noteText, setNoteText] = useState("");
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | undefined>(undefined);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  // Cache whether today's mood is set, so it doesn't change when navigating months
  const [hasTodaysMood, setHasTodaysMood] = useState(false);

  // Format today's date as YYYY-MM-DD for comparison
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Load mood entries from Supabase
  useEffect(() => {
    async function loadMoodEntries() {
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

        // Fetch mood entries for the current month
        const entries = await fetchMoodEntries({
          startDate,
          endDate,
        });

        // Convert to the format our component uses
        const newMoodData: Record<string, MoodEntry> = {};

        entries.forEach((entry: MoodEntryType) => {
          // Validate that the mood is one of our accepted types
          if (
            ["great", "good", "neutral", "bad", "awful"].includes(entry.mood)
          ) {
            newMoodData[entry.date] = {
              id: entry.id, // Store the ID for update operations
              mood: entry.mood as Mood,
              note: entry.note || undefined,
            };
          }
        });

        setMoodData(newMoodData);
      } catch (err) {
        console.error("Error loading mood entries:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load mood entries",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadMoodEntries();
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
    const existingEntry = moodData[date];

    // Set the selected date first
    setSelectedDate(date);

    // Then set the mood and note if an entry exists
    if (existingEntry) {
      setSelectedMood(existingEntry.mood);
      setNoteText(existingEntry.note || "");
      setEntryId(existingEntry.id);
    } else {
      setSelectedMood(null);
      setNoteText("");
      setEntryId(undefined);
    }

    // Finally, open the popup
    setShowMoodPopup(true);
  };

  // Handle the Add/Update Today's Mood button click
  const handleTodayMoodClick = () => {
    const existingEntry = moodData[todayStr];

    // Set the selected date first
    setSelectedDate(todayStr);

    // Then set the mood and note if an entry exists
    if (existingEntry) {
      setSelectedMood(existingEntry.mood);
      setNoteText(existingEntry.note || "");
      setEntryId(existingEntry.id);
    } else {
      setSelectedMood(null);
      setNoteText("");
      setEntryId(undefined);
    }

    // Finally, open the popup
    setShowMoodPopup(true);
  };

  // Handle mood saved callback from popup
  const handleMoodSaved = (
    date: string,
    mood: Mood,
    note?: string,
    isUpdate?: boolean,
  ) => {
    // Create a copy of the current mood data
    const updatedMoodData = { ...moodData };

    // Update local state for immediate UI feedback
    updatedMoodData[date] = {
      ...updatedMoodData[date],
      mood: mood,
      note: note,
    };

    // Update state
    setMoodData(updatedMoodData);

    // If today's date was updated, update the hasTodaysMood state
    if (date === todayStr) {
      setHasTodaysMood(true);
    }

    // Reset form state after saving
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
  };

  // Handle closing the mood popup
  const handleCloseMoodPopup = () => {
    setShowMoodPopup(false);
    // Reset state to avoid stale data
    setSelectedDate(null);
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
  };

  // Add a handler for mood deletion
  const handleMoodDeleted = (date: string) => {
    // Create a copy of the current mood data
    const updatedMoodData = { ...moodData };
    
    // Remove the entry for the deleted date
    delete updatedMoodData[date];
    
    // Update state
    setMoodData(updatedMoodData);
    
    // If today's date was deleted, update the hasTodaysMood state
    if (date === todayStr) {
      setHasTodaysMood(false);
    }
    
    // Reset form state after deletion
    setSelectedMood(null);
    setNoteText("");
    setEntryId(undefined);
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
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-default-900 mb-4">
          Mood Tracker
        </h1>
        <p className="text-default-600">
          Track your daily moods to identify patterns and improve your mental
          well-being.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg">
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
      </section>

      <section className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <motion.button
              aria-label="Previous month"
              className={`p-2 rounded-full hover:bg-default-100 transition-colors ${isEarliestAllowedDate ? "opacity-30 cursor-not-allowed" : ""}`}
              disabled={isEarliestAllowedDate || isLoading}
              whileHover={
                !isEarliestAllowedDate && !isLoading ? { scale: 1.1 } : {}
              }
              whileTap={
                !isEarliestAllowedDate && !isLoading ? { scale: 0.9 } : {}
              }
              onClick={handlePrevMonth}
            >
              <svg
                className="w-5 h-5 text-default-700"
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
            </motion.button>

            <h2 className="text-2xl font-semibold text-default-800 min-w-[180px] text-center">
              {monthName} {year}
            </h2>

            <motion.button
              aria-label="Next month"
              className={`p-2 rounded-full hover:bg-default-100 transition-colors ${isCurrentMonth || isLoading ? "opacity-30 cursor-not-allowed" : ""}`}
              disabled={isCurrentMonth || isLoading}
              whileHover={!isCurrentMonth && !isLoading ? { scale: 1.1 } : {}}
              whileTap={!isCurrentMonth && !isLoading ? { scale: 0.9 } : {}}
              onClick={handleNextMonth}
            >
              <svg
                className="w-5 h-5 text-default-700"
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
            </motion.button>

            <motion.button
              aria-label="Open calendar"
              className="p-2 rounded-full hover:bg-default-100 transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCalendarPopup(true)}
            >
              <svg
                className="w-5 h-5 text-default-700"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </div>

          <Button
            className="font-medium"
            color="primary"
            disabled={isLoading}
            onClick={handleTodayMoodClick}
          >
            {hasTodaysMood ? "Update Today's Mood" : "+ Add Today's Mood"}
          </Button>
        </div>

        {/* Calendar */}
        <div className="bg-background/50 rounded-xl shadow-sm border border-default-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center font-medium py-3 border-b border-default-200">
            <div className="text-default-500">Mon</div>
            <div className="text-default-500">Tue</div>
            <div className="text-default-500">Wed</div>
            <div className="text-default-500">Thu</div>
            <div className="text-default-500">Fri</div>
            <div className="text-default-500">Sat</div>
            <div className="text-default-500">Sun</div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-default-600">Loading...</p>
              </div>
            </div>
          )}

          {/* Calendar grid with animation */}
          <AnimatePresence custom={slideDirection} mode="wait">
            <motion.div
              key={`${year}-${displayDate.getMonth()}`}
              animate="center"
              className="grid grid-cols-7 text-center gap-y-2 py-2"
              custom={slideDirection}
              exit="exit"
              initial="enter"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              variants={calendarVariants}
            >
              {calendarDays.map((dayObj, i) => (
                <div key={i} className="p-2 md:p-3">
                  {dayObj ? (
                    <div
                      className="relative group"
                      style={{
                        pointerEvents: dayObj.isFutureDate ? "none" : "auto",
                        cursor: dayObj.isFutureDate ? "not-allowed" : "pointer",
                        opacity: dayObj.isFutureDate ? 0.4 : 1,
                      }}
                      onClick={() =>
                        !dayObj.isFutureDate && handleDayClick(dayObj.dateStr)
                      }
                    >
                      {/* Conditional Circle indicator for today's date */}
                      {dayObj.isToday && (
                        <AnimatePresence>
                          <motion.div
                            layout
                            animate={{ scale: 1, opacity: 1 }}
                            className={`absolute rounded-full border-2 border-primary z-1 ${
                              dayObj.moodEntry
                                ? "inset-0 w-full h-full -m-1"
                                : "inset-x-0 top-0 h-7 -m-1"
                            }`}
                            exit={{ scale: 0.95, opacity: 0 }}
                            initial={{ scale: 0.95, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          />
                        </AnimatePresence>
                      )}

                      <div
                        className={`
                        text-default-700 mb-1 font-medium relative z-5
                        ${dayObj.isToday ? "text-primary" : ""}
                      `}
                      >
                        <span className="relative z-5">{dayObj.day}</span>
                      </div>

                      {/* Mood indicator or add button on hover */}
                      <motion.div layout className="relative h-6 w-6 mx-auto">
                        {dayObj.moodEntry ? (
                          <motion.div
                            layout
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative w-5 h-5 mx-auto"
                            initial={{ scale: 0.8, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={() => setHoveredMood(dayObj.dateStr)}
                            onMouseLeave={() => setHoveredMood(null)}
                          >
                            <div
                              className={`w-5 h-5 rounded-full ${getMoodColor(dayObj.moodEntry.mood)} relative`}
                            >
                              {/* Show tooltip when hovering */}
                              <AnimatePresence>
                                {hoveredMood === dayObj.dateStr && (
                                  <MoodTooltip
                                    mood={dayObj.moodEntry.mood}
                                    note={dayObj.moodEntry.note}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            {/* Show note indicator if there's a note - smaller and closer to the main circle */}
                            {dayObj.moodEntry.note && (
                              <motion.div
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary border border-background"
                                initial={{ scale: 0, opacity: 0 }}
                                transition={{ delay: 0.1 }}
                              />
                            )}
                          </motion.div>
                        ) : (
                          !dayObj.isFutureDate && (
                            <>
                              {/* Plus icon shown on hover when no mood is set */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.div
                                  className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <svg
                                    className="w-3 h-3 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 4.5v15m7.5-7.5h-15"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </motion.div>
                              </div>
                            </>
                          )
                        )}
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-default-300" />
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-default-800 mb-3">
          Mood Guide
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pastel-green" />
            <span className="text-default-700">Great</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pastel-blue" />
            <span className="text-default-700">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pastel-yellow" />
            <span className="text-default-700">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pastel-orange" />
            <span className="text-default-700">Bad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pastel-pink" />
            <span className="text-default-700">Awful</span>
          </div>
          {/* Note indicator */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-default-300 relative">
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-secondary border border-background" />
            </div>
            <span className="text-default-700">Has notes</span>
          </div>
        </div>
      </section>

      {/* Use the new MoodPopup component */}
      {showMoodPopup && selectedDate && (
        <MoodPopup
          entryId={entryId}
          initialMood={selectedMood}
          initialNote={noteText}
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
            currentDate={displayDate}
            onClose={() => setShowCalendarPopup(false)}
            onSelectDate={setDisplayDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get color based on mood
function getMoodColor(mood: Mood): string {
  return moodStyles[mood].bgClass;
}
