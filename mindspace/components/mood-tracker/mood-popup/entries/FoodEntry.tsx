import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FoodEntryProps {
  initialData: any;
  onChange: (data: any) => void;
  isDisabled: boolean;
}

export default function FoodEntry({
  initialData,
  onChange,
  isDisabled,
}: FoodEntryProps) {
  // State for meals
  const [meals, setMeals] = useState<string>(
    initialData?.meals || ""
  );
  
  // How the user felt after eating
  const [feelingAfter, setFeelingAfter] = useState<string>(
    initialData?.feeling_after || ""
  );

  // Pass data up to parent component whenever values change
  useEffect(() => {
    // Only update if we have actual data or initialData exists
    if (meals || feelingAfter || initialData) {
      onChange({
        id: initialData?.id, // Make sure to preserve the ID
        meals,
        feeling_after: feelingAfter,
      });
    }
  }, [meals, feelingAfter, initialData?.id]);  // Remove onChange from dependencies

  const handleMealsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMeals(e.target.value);
  };

  const handleFeelingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeelingAfter(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-default-800 font-medium">Food</h3>
      
      <div className="space-y-6">
        {/* Meals eaten */}
        <div>
          <label className="block text-default-700 text-sm font-medium mb-2">
            What did you eat today?
          </label>
          <div className="text-xs text-default-500 mb-2">
            List your meals separated by commas (e.g. "Oatmeal for breakfast, Salad for lunch")
          </div>
          <motion.textarea
            className="w-full h-24 p-3 rounded-lg border border-default-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-default-900 resize-none"
            disabled={isDisabled}
            placeholder="Breakfast, Lunch, Dinner, Snacks..."
            transition={{ duration: 0.2 }}
            value={meals}
            whileFocus={{
              borderColor: "var(--color-primary)",
              boxShadow: "0 0 0 2px rgba(var(--color-primary-rgb), 0.2)",
            }}
            onChange={handleMealsChange}
          />
        </div>
        
        {/* Feeling after eating */}
        <div>
          <label className="block text-default-700 text-sm font-medium mb-2">
            How did you feel after eating? (optional)
          </label>
          <motion.textarea
            className="w-full h-24 p-3 rounded-lg border border-default-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-default-900 resize-none"
            disabled={isDisabled}
            placeholder="Did you feel energised, sluggish, satisfied, etc?"
            transition={{ duration: 0.2 }}
            value={feelingAfter}
            whileFocus={{
              borderColor: "var(--color-primary)",
              boxShadow: "0 0 0 2px rgba(var(--color-primary-rgb), 0.2)",
            }}
            onChange={handleFeelingChange}
          />
        </div>
        
        {/* Tips */}
        <div className="bg-white/50 p-4 rounded-lg">
          <h4 className="text-default-700 text-sm font-medium mb-2">Nutrition Tips</h4>
          <div className="text-xs space-y-1 text-default-600">
            <p>• Try to include fruits and vegetables in at least two meals daily</p>
            <p>• Stay hydrated while eating to aid digestion</p>
            <p>• Notice how different foods affect your energy levels</p>
            <p>• Tracking meals can help identify food sensitivities over time</p>
          </div>
        </div>
      </div>
    </div>
  );
} 