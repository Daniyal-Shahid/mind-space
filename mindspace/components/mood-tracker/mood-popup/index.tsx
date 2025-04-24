import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";

import { insertMoodEntry, updateMoodEntry, deleteMoodEntry } from "@/utils/mood";
import { 
  insertSleepEntry, updateSleepEntry, deleteSleepEntry,
  insertFoodEntry, updateFoodEntry, deleteFoodEntry,
  insertWaterEntry, updateWaterEntry, deleteWaterEntry,
  insertGratitudeEntry, updateGratitudeEntry, deleteGratitudeEntry
} from "@/utils/entries";
import DeleteConfirmation from "../delete-confirmation";
import SleepEntry from "./entries/SleepEntry";
import FoodEntry from "./entries/FoodEntry";
import WaterEntry from "./entries/WaterEntry";
import GratitudeEntry from "./entries/GratitudeEntry";

// Mood types
type Mood = "great" | "good" | "neutral" | "bad" | "awful";

// Props for the component
interface MoodPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  initialMood?: Mood | null;
  initialNote?: string;
  entryId?: string;
  isToday: boolean;
  onSaved: (
    date: string,
    mood: Mood,
    note?: string,
    isUpdate?: boolean,
    sleepEntry?: any,
    foodEntry?: any,
    waterEntry?: any,
    gratitudeEntry?: any
  ) => void;
  onDeleted?: (date: string) => void;
  // New props for additional entries
  initialSleepEntry?: any;
  initialFoodEntry?: any;
  initialWaterEntry?: any;
  initialGratitudeEntry?: any;
}

// Mood descriptions for tooltips
const moodDescriptions: Record<Mood, string> = {
  great: "Feeling amazing - energetic, joyful, and accomplished",
  good: "Feeling positive - content and calm",
  neutral: "Feeling okay - neither good nor bad",
  bad: "Feeling down - sad, tired, or stressed",
  awful: "Feeling terrible - extremely upset or distressed",
};

// Mood colours for different moods
const moodStyles: Record<Mood, { bgClass: string; lightText: boolean }> = {
  great: { bgClass: "bg-pastel-green", lightText: false },
  good: { bgClass: "bg-pastel-blue", lightText: false },
  neutral: { bgClass: "bg-pastel-yellow", lightText: false },
  bad: { bgClass: "bg-pastel-orange", lightText: false },
  awful: { bgClass: "bg-pastel-pink", lightText: false },
};

// Helper function to get color based on mood
function getMoodColor(mood: Mood): string {
  return moodStyles[mood].bgClass;
}

export default function MoodPopup({
  isOpen,
  onClose,
  selectedDate,
  initialMood,
  initialNote = "",
  entryId,
  isToday,
  onSaved,
  onDeleted,
  initialSleepEntry,
  initialFoodEntry,
  initialWaterEntry,
  initialGratitudeEntry,
}: MoodPopupProps) {
  // Store the current entry ID to detect changes
  const prevEntryIdRef = useRef<string | undefined>(entryId);
  const prevDateRef = useRef<string>(selectedDate);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(
    initialMood || null,
  );
  const [noteText, setNoteText] = useState(initialNote);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // States for additional entries
  const [sleepEntry, setSleepEntry] = useState(initialSleepEntry || null);
  const [foodEntry, setFoodEntry] = useState(initialFoodEntry || null);
  const [waterEntry, setWaterEntry] = useState(initialWaterEntry || null);
  const [gratitudeEntry, setGratitudeEntry] = useState(initialGratitudeEntry || null);
  
  // State to track active tab
  const [activeTab, setActiveTab] = useState<string>("mood");

  // Update state when entry ID or date changes
  useEffect(() => {
    // Only update if the popup is open and either the entry ID or date has changed
    if (
      isOpen &&
      (prevEntryIdRef.current !== entryId ||
        prevDateRef.current !== selectedDate)
    ) {
      setSelectedMood(initialMood || null);
      setNoteText(initialNote || "");
      setError(null);
      setSleepEntry(initialSleepEntry || null);
      setFoodEntry(initialFoodEntry || null);
      setWaterEntry(initialWaterEntry || null);
      setGratitudeEntry(initialGratitudeEntry || null);

      // Update refs
      prevEntryIdRef.current = entryId;
      prevDateRef.current = selectedDate;
    }
  }, [isOpen, initialMood, initialNote, selectedDate, entryId, initialSleepEntry, initialFoodEntry, initialWaterEntry, initialGratitudeEntry]);

  // Format date for display
  const formattedDate = isToday
    ? "Today"
    : new Date(selectedDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });

  // Determine if this is an update or add operation
  const isUpdate = !!entryId;

  // Handle saving/updating entries
  const handleSave = async () => {
    if (!selectedMood) return;

    try {
      setIsLoading(true);
      setError(null);

      const trimmedNote = noteText.trim() || undefined;

      // Save mood entry
      if (isUpdate && entryId) {
        // Update existing entry
        await updateMoodEntry({
          id: entryId,
          mood: selectedMood,
          note: trimmedNote,
        });
      } else {
        // Create new entry
        await insertMoodEntry({
          mood: selectedMood,
          note: trimmedNote,
          date: selectedDate,
        });
      }

      // Save sleep entry if provided
      if (sleepEntry) {
        if (sleepEntry.id) {
          await updateSleepEntry({
            id: sleepEntry.id,
            hours_slept: sleepEntry.hours_slept,
            sleep_quality: sleepEntry.sleep_quality,
          });
        } else {
          await insertSleepEntry({
            hours_slept: sleepEntry.hours_slept,
            sleep_quality: sleepEntry.sleep_quality,
            date: selectedDate,
          });
        }
      }
      
      // Save food entry if provided
      if (foodEntry) {
        if (foodEntry.id) {
          await updateFoodEntry({
            id: foodEntry.id,
            meals: foodEntry.meals,
            feeling_after: foodEntry.feeling_after,
          });
        } else {
          await insertFoodEntry({
            meals: foodEntry.meals,
            feeling_after: foodEntry.feeling_after,
            date: selectedDate,
          });
        }
      }
      
      // Save water entry if provided
      if (waterEntry) {
        if (waterEntry.id) {
          await updateWaterEntry({
            id: waterEntry.id,
            cups: waterEntry.cups,
          });
        } else {
          await insertWaterEntry({
            cups: waterEntry.cups,
            date: selectedDate,
          });
        }
      }
      
      // Save gratitude entry if provided
      if (gratitudeEntry) {
        if (gratitudeEntry.id) {
          await updateGratitudeEntry({
            id: gratitudeEntry.id,
            gratitude_items: gratitudeEntry.gratitude_items,
          });
        } else {
          await insertGratitudeEntry({
            gratitude_items: gratitudeEntry.gratitude_items,
            date: selectedDate,
          });
        }
      }

      // Call the callback with the updated/added data
      onSaved(
        selectedDate, 
        selectedMood, 
        trimmedNote, 
        isUpdate,
        sleepEntry,
        foodEntry,
        waterEntry,
        gratitudeEntry
      );
      onClose();
    } catch (err) {
      console.error("Error saving entry:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save entries"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting entries
  const handleDelete = async () => {
    if (!entryId) return;

    // If there's a note, show confirmation dialog first
    if (noteText.trim()) {
      setShowDeleteConfirmation(true);
      return;
    }

    // Otherwise, delete directly
    await performDelete();
  };

  // Perform the actual deletion
  const performDelete = async () => {
    if (!entryId) return;

    try {
      setIsDeleting(true);
      setError(null);

      // Delete the mood entry
      await deleteMoodEntry(entryId);
      
      // Delete additional entries if they exist
      if (sleepEntry?.id) {
        await deleteSleepEntry(sleepEntry.id);
      }
      
      if (foodEntry?.id) {
        await deleteFoodEntry(foodEntry.id);
      }
      
      if (waterEntry?.id) {
        await deleteWaterEntry(waterEntry.id);
      }
      
      if (gratitudeEntry?.id) {
        await deleteGratitudeEntry(gratitudeEntry.id);
      }

      // Call the callback to notify parent component
      if (onDeleted) {
        onDeleted(selectedDate);
      }

      // Close popups
      setShowDeleteConfirmation(false);
      onClose();
    } catch (err) {
      console.error("Error deleting mood:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete mood entry"
      );
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset state when closed
  const handleClose = () => {
    // First reset form state
    setError(null);

    // Then close the popup (we'll rely on the useEffect to reset form fields on next open)
    onClose();
  };

  // Update sleep entry data
  const handleSleepEntryChange = (data: any) => {
    setSleepEntry(data);
  };

  // Update food entry data
  const handleFoodEntryChange = (data: any) => {
    setFoodEntry(data);
  };

  // Update water entry data
  const handleWaterEntryChange = (data: any) => {
    setWaterEntry(data);
  };

  // Update gratitude entry data
  const handleGratitudeEntryChange = (data: any) => {
    setGratitudeEntry(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="modal-backdrop"
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            key="modal-content"
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-background rounded-xl shadow-lg p-6 max-w-5xl w-full"
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <motion.h3
              layout
              className="text-xl font-semibold text-default-900 mb-4"
            >
              {isUpdate
                ? `Update Entries for ${formattedDate}`
                : `Add Entries for ${formattedDate}`}
            </motion.h3>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 text-sm rounded-lg"
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  key="error-message"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                  <p className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs navigation */}
            <div className="flex border-b border-default-200 mb-4">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "mood"
                    ? "text-primary border-b-2 border-primary"
                    : "text-default-600 hover:text-primary"
                }`}
                onClick={() => setActiveTab("mood")}
              >
                Mood
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "sleep"
                    ? "text-primary border-b-2 border-primary"
                    : "text-default-600 hover:text-primary"
                }`}
                onClick={() => setActiveTab("sleep")}
              >
                Sleep
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "food"
                    ? "text-primary border-b-2 border-primary"
                    : "text-default-600 hover:text-primary"
                }`}
                onClick={() => setActiveTab("food")}
              >
                Food
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "water"
                    ? "text-primary border-b-2 border-primary"
                    : "text-default-600 hover:text-primary"
                }`}
                onClick={() => setActiveTab("water")}
              >
                Water
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "gratitude"
                    ? "text-primary border-b-2 border-primary"
                    : "text-default-600 hover:text-primary"
                }`}
                onClick={() => setActiveTab("gratitude")}
              >
                Gratitude
              </button>
            </div>

            {/* Dashboard View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left Column - Always show Mood */}
              <div className="lg:col-span-1">
                <div className="p-4 bg-default-50 rounded-lg">
                  <h4 className="text-default-800 font-medium mb-3">Mood</h4>
                  <div className="flex flex-col gap-4">
                    <p className="text-default-600">
                      {isUpdate
                        ? "How were you really feeling on this day?"
                        : "How were you feeling on this day?"}
                    </p>

                    {/* Mood selection */}
                    <div className="flex justify-between">
                      {(["great", "good", "neutral", "bad", "awful"] as Mood[]).map(
                        (mood) => (
                          <MoodButton
                            key={mood}
                            description={moodDescriptions[mood]}
                            isDisabled={isLoading || isDeleting}
                            isSelected={selectedMood === mood}
                            mood={mood}
                            onClick={() => setSelectedMood(mood)}
                          />
                        ),
                      )}
                    </div>

                    {/* Note text area */}
                    <div className="mt-2">
                      <label className="block text-default-700 text-sm font-medium mb-2">
                        What happened {isToday ? "today" : "on this day"}? (optional)
                      </label>
                      <motion.textarea
                        className="w-full h-24 p-3 rounded-lg border border-default-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-default-900 resize-none"
                        disabled={isLoading || isDeleting}
                        placeholder="Write a short note about your day..."
                        transition={{ duration: 0.2 }}
                        value={noteText}
                        whileFocus={{
                          borderColor: "var(--color-primary)",
                          boxShadow: "0 0 0 2px rgba(var(--color-primary-rgb), 0.2)",
                        }}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Show active component based on tab */}
              <div className="lg:col-span-2">
                <div className="p-4 bg-default-50 rounded-lg h-full">
                  {activeTab === "sleep" && (
                    <SleepEntry 
                      initialData={sleepEntry}
                      onChange={handleSleepEntryChange}
                      isDisabled={isLoading || isDeleting}
                    />
                  )}
                  
                  {activeTab === "food" && (
                    <FoodEntry 
                      initialData={foodEntry}
                      onChange={handleFoodEntryChange}
                      isDisabled={isLoading || isDeleting}
                    />
                  )}
                  
                  {activeTab === "water" && (
                    <WaterEntry 
                      initialData={waterEntry}
                      onChange={handleWaterEntryChange}
                      isDisabled={isLoading || isDeleting}
                    />
                  )}
                  
                  {activeTab === "gratitude" && (
                    <GratitudeEntry 
                      initialData={gratitudeEntry}
                      onChange={handleGratitudeEntryChange}
                      isDisabled={isLoading || isDeleting}
                    />
                  )}

                  {activeTab === "mood" && (
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="p-4 bg-white/50 rounded-lg">
                        <h4 className="text-default-800 font-medium mb-2">Sleep</h4>
                        <p className="text-sm text-default-600">
                          {sleepEntry ? 
                            <>
                              <span className="font-medium">Sleep: {sleepEntry.hours_slept} hours</span>, Quality: <span className="font-medium">{sleepEntry.sleep_quality}/10</span>
                              {sleepEntry.sleep_quality >= 8 ? ' (Excellent)' : 
                               sleepEntry.sleep_quality >= 6 ? ' (Good)' : 
                               sleepEntry.sleep_quality >= 4 ? ' (Average)' : ' (Poor)'}
                            </> 
                            : "No sleep data recorded yet"}
                        </p>
                        <Button
                          className="mt-3"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => setActiveTab("sleep")}
                        >
                          {sleepEntry ? "Edit Sleep" : "Add Sleep"}
                        </Button>
                      </div>

                      <div className="p-4 bg-white/50 rounded-lg">
                        <h4 className="text-default-800 font-medium mb-2">Food</h4>
                        <p className="text-sm text-default-600">
                          {foodEntry ? 
                            <>
                              <span className="font-medium">{foodEntry.meals.split(",").length} meals</span> recorded
                              {foodEntry.feeling_after ? 
                                <>: <span className="italic">&quot;{foodEntry.feeling_after.substring(0, 35)}{foodEntry.feeling_after.length > 35 ? '...' : ''}&quot;</span></> : 
                                ''}
                            </> : 
                            "No food data recorded yet"}
                        </p>
                        <Button
                          className="mt-3"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => setActiveTab("food")}
                        >
                          {foodEntry ? "Edit Food" : "Add Food"}
                        </Button>
                      </div>

                      <div className="p-4 bg-white/50 rounded-lg">
                        <h4 className="text-default-800 font-medium mb-2">Water</h4>
                        <p className="text-sm text-default-600">
                          {waterEntry ? 
                            <>
                              <span className="font-medium">{waterEntry.cups} cup{waterEntry.cups !== 1 ? 's' : ''}</span> of water
                              {waterEntry.cups >= 8 ? ' (Well hydrated)' : 
                               waterEntry.cups >= 5 ? ' (Good hydration)' : 
                               waterEntry.cups >= 3 ? ' (Average)' : ' (Low intake)'}
                            </> : 
                            "No water intake recorded yet"}
                        </p>
                        <Button
                          className="mt-3"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => setActiveTab("water")}
                        >
                          {waterEntry ? "Edit Water" : "Add Water"}
                        </Button>
                      </div>

                      <div className="p-4 bg-white/50 rounded-lg">
                        <h4 className="text-default-800 font-medium mb-2">Gratitude</h4>
                        <p className="text-sm text-default-600">
                          {gratitudeEntry ? 
                            <>
                              <span className="font-medium">
                                {gratitudeEntry.gratitude_items.split('\n').filter((line: string) => line.trim()).length} 
                                {gratitudeEntry.gratitude_items.split('\n').filter((line: string) => line.trim()).length === 1 ? ' item' : ' items'}
                              </span> of gratitude recorded
                            </> : 
                            "No gratitude items recorded yet"}
                        </p>
                        <Button
                          className="mt-3"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => setActiveTab("gratitude")}
                        >
                          {gratitudeEntry ? "Edit Gratitude" : "Add Gratitude"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              {/* Delete button - only show for existing entries */}
              {isUpdate && (
                <Button
                  color="danger"
                  disabled={isLoading || isDeleting}
                  size="sm"
                  variant="flat"
                  onPress={handleDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete Entries"}
                </Button>
              )}

              {/* Save/Cancel buttons */}
              <div className="flex justify-end gap-2 ml-auto">
                <Button
                  color="default"
                  disabled={isLoading || isDeleting}
                  variant="flat"
                  onPress={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  className="relative"
                  color="primary"
                  disabled={!selectedMood || isLoading || isDeleting}
                  onPress={handleSave}
                >
                  {isLoading ? (
                    <>
                      <span className="opacity-0">
                        {isUpdate ? "Update" : "Save"}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    </>
                  ) : isUpdate ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      {showDeleteConfirmation && (
        <AnimatePresence>
          <DeleteConfirmation
            key="delete-confirmation"
            isLoading={isDeleting}
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            onConfirm={performDelete}
          />
        </AnimatePresence>
      )}
    </>
  );
}

// Separate component for the mood selection buttons
interface MoodButtonProps {
  mood: Mood;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  description: string;
}

function MoodButton({
  mood,
  isSelected,
  isDisabled,
  onClick,
  description,
}: MoodButtonProps) {
  return (
    <motion.button
      animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      aria-label={`Select mood: ${mood}`}
      className={`p-3 hover:bg-${getMoodColor(mood).substring(3)}/20 rounded-full transition-colors ${
        isSelected
          ? `ring-2 ring-${getMoodColor(mood).substring(3)} ring-offset-2`
          : ""
      }`}
      disabled={isDisabled}
      initial={{ scale: 1 }}
      title={description}
      transition={{ duration: 0.3, type: "spring" }}
      whileHover={!isDisabled ? { scale: 1.1 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
    >
      <div
        className={`w-8 h-8 rounded-full ${getMoodColor(mood)} relative group`}
      >
        {/* Tooltip that shows on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 min-w-max px-2 py-1 bg-default-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="font-medium">
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </div>
          <div className="text-white/70 text-xs">{description}</div>
        </div>
      </div>
    </motion.button>
  );
}
