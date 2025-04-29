import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Mood } from "@/types/mood";
import CalendarPopup from "@/components/mood-tracker/calendar-popup";

interface CalendarProps {
  displayDate: Date;
  moodData: Record<string, { mood: Mood; note?: string }>;
  sleepData: Record<string, { hours_slept: number; sleep_quality: number }>;
  foodData: Record<string, { meals: string }>;
  waterData: Record<string, { cups: number }>;
  gratitudeData: Record<string, { gratitude_items: string }>;
  onDayClick: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
  isEarliestAllowedDate: boolean;
  todayStr: string;
  onSelectDate?: (date: Date) => void;
}

interface CalendarDay {
  day: number;
  moodEntry?: {
    mood: Mood;
    note?: string;
  };
  dateStr: string;
  isFutureDate: boolean;
  isToday: boolean;
}

// Mood styles for different moods
const moodStyles: Record<Mood, { bgClass: string; lightText: boolean }> = {
  great: { bgClass: "bg-pastel-green", lightText: false },
  good: { bgClass: "bg-pastel-blue", lightText: false },
  neutral: { bgClass: "bg-pastel-yellow", lightText: false },
  bad: { bgClass: "bg-pastel-orange", lightText: false },
  awful: { bgClass: "bg-pastel-pink", lightText: false },
};

export default function Calendar({
  displayDate,
  moodData,
  sleepData,
  foodData,
  waterData,
  gratitudeData,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
  isEarliestAllowedDate,
  todayStr,
  onSelectDate,
}: CalendarProps) {
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  // Get current month and year
  const monthName = displayDate.toLocaleString("en-GB", { month: "long" });
  const year = displayDate.getFullYear();

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
    const isFutureDate = new Date(dateStr) > new Date();

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

  // Function to render the tooltip content for a specific day
  const renderTooltipContent = (day: CalendarDay) => {
    if (!day.moodEntry) return null;
    
    return (
      <div className="px-2 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${moodStyles[day.moodEntry.mood].bgClass}`} />
          <span className="font-medium capitalize">
            {day.moodEntry.mood}
          </span>
        </div>
        
        {day.moodEntry.note && (
          <div className="text-default-600 text-sm mb-3">
            {day.moodEntry.note}
          </div>
        )}
        
        {/* Show additional entries if they exist */}
        <div className="space-y-2 text-sm">
          {sleepData[day.dateStr] && (
            <div className="flex items-center gap-2 text-default-700">
              <span className="text-default-500">💤</span>
              <span>{sleepData[day.dateStr].hours_slept}h sleep • {sleepData[day.dateStr].sleep_quality}/10 quality</span>
            </div>
          )}
          
          {waterData[day.dateStr] && (
            <div className="flex items-center gap-2 text-default-700">
              <span className="text-default-500">💧</span>
              <span>{waterData[day.dateStr].cups} cup{waterData[day.dateStr].cups !== 1 ? 's' : ''} of water</span>
            </div>
          )}
          
          {foodData[day.dateStr] && (
            <div className="flex items-center gap-2 text-default-700">
              <span className="text-default-500">🍽️</span>
              <span>{foodData[day.dateStr].meals.split(',').length} meals recorded</span>
            </div>
          )}
          
          {gratitudeData[day.dateStr] && (
            <div className="flex items-center gap-2 text-default-700">
              <span className="text-default-500">🙏</span>
              <span>{gratitudeData[day.dateStr].gratitude_items.split('\n').filter((line: string) => line.trim()).length} gratitude items</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle month selection from popup
  const handleSelectDate = (date: Date) => {
    if (onSelectDate) {
      onSelectDate(date);
    }
  };

  return (
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
              onClick={onPrevMonth}
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
              onClick={onNextMonth}
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
                day.moodEntry ? (
                  <Tooltip
                    key={day.dateStr}
                    content={renderTooltipContent(day)}
                    placement="top"
                    delay={300}
                    closeDelay={100}
                    motionProps={{
                      variants: {
                        exit: {
                          opacity: 0,
                          transition: {
                            duration: 0.1,
                            ease: "easeIn"
                          }
                        },
                        enter: {
                          opacity: 1,
                          transition: {
                            duration: 0.15,
                            ease: "easeOut"
                          }
                        }
                      }
                    }}
                  >
                    <motion.button
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                        day.isToday
                          ? "ring-2 ring-primary ring-opacity-60"
                          : "cursor-pointer"
                      }`}
                      initial={{ scale: 1 }}
                      key={day.dateStr}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onDayClick(day.dateStr)}
                    >
                      {/* Day number */}
                      <span
                        className={`text-sm font-medium z-10 ${
                          moodStyles[day.moodEntry.mood].lightText
                            ? "text-white"
                            : "text-default-800"
                        }`}
                      >
                        {day.day}
                      </span>

                      {/* Mood indicator */}
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
                    </motion.button>
                  </Tooltip>
                ) : (
                  <motion.button
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                      day.isToday
                        ? "ring-2 ring-primary ring-opacity-60"
                        : day.isFutureDate
                        ? "bg-default-100/50 cursor-not-allowed"
                        : "bg-default-100 hover:bg-default-200 cursor-pointer"
                    }`}
                    disabled={day.isFutureDate}
                    initial={{ scale: 1 }}
                    key={day.dateStr}
                    transition={{ duration: 0.2 }}
                    whileHover={
                      !day.isFutureDate ? { scale: 1.05 } : undefined
                    }
                    onClick={() => onDayClick(day.dateStr)}
                  >
                    {/* Day number */}
                    <span className="text-sm font-medium text-default-800">
                      {day.day}
                    </span>
                  </motion.button>
                )
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

      {/* Calendar popup */}
      <AnimatePresence>
        {showCalendarPopup && (
          <CalendarPopup
            key="calendar-popup"
            currentDate={displayDate}
            onClose={() => setShowCalendarPopup(false)}
            onSelectDate={handleSelectDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 