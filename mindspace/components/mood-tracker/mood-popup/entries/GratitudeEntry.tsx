import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GratitudeEntryProps {
  initialData: any;
  onChange: (data: any) => void;
  isDisabled: boolean;
}

export default function GratitudeEntry({
  initialData,
  onChange,
  isDisabled,
}: GratitudeEntryProps) {
  // State for gratitude items
  const [gratitudeItems, setGratitudeItems] = useState<string>(
    initialData?.gratitude_items || ""
  );

  // Pass data up to parent component whenever values change
  useEffect(() => {
    onChange({
      id: initialData?.id,
      gratitude_items: gratitudeItems,
    });
  }, [gratitudeItems, initialData?.id]);

  const handleGratitudeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGratitudeItems(e.target.value);
  };

  // Predefined gratitude prompts to help users
  const gratitudePrompts = [
    "Someone who helped me today...",
    "Something beautiful I noticed...",
    "A skill or ability I&apos;m thankful for...",
    "A small pleasure I enjoyed today...",
    "A challenge that helped me grow...",
    "Something I&apos;m looking forward to..."
  ];

  // Randomly select a prompt
  const getRandomPrompt = () => {
    if (isDisabled) return;
    const randomIndex = Math.floor(Math.random() * gratitudePrompts.length);
    if (!gratitudeItems) {
      setGratitudeItems(gratitudePrompts[randomIndex]);
    } else {
      setGratitudeItems(prev => 
        prev + (prev.endsWith("\n") || prev === "" ? "" : "\n\n") + 
        gratitudePrompts[randomIndex]
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-default-800 font-medium">Gratitude Journal</h3>
      
      <div className="space-y-6">
        {/* Gratitude entry field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="gratitudeItems" className="block text-default-700 text-sm font-medium">
              What are you grateful for today?
            </label>
            <motion.button
              className="text-primary text-xs font-medium px-2 py-1 rounded-md hover:bg-primary/10 disabled:opacity-50"
              disabled={isDisabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={getRandomPrompt}
            >
              Need a prompt?
            </motion.button>
          </div>
          <motion.textarea
            id="gratitudeItems"
            className="w-full h-40 p-3 rounded-lg border border-default-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-default-900 resize-none"
            disabled={isDisabled}
            placeholder="Write down things you&apos;re grateful for..."
            transition={{ duration: 0.2 }}
            value={gratitudeItems}
            whileFocus={{
              borderColor: "var(--color-primary)",
              boxShadow: "0 0 0 2px rgba(var(--color-primary-rgb), 0.2)",
            }}
            onChange={handleGratitudeChange}
          />
          <p className="text-xs text-default-500 mt-2">
            Try to write at least three things you&apos;re grateful for. You can add more items using separate lines.
          </p>
        </div>
        
        {/* Benefits of gratitude */}
        <div className="bg-white/50 p-4 rounded-lg">
          <h4 className="text-default-700 text-sm font-medium mb-2">Benefits of Gratitude</h4>
          <div className="text-xs space-y-1 text-default-600">
            <p>• Increases positive emotions and reduces negative ones</p>
            <p>• Improves sleep quality when practised before bedtime</p>
            <p>• Enhances empathy and reduces aggression</p>
            <p>• Strengthens resilience and mental health over time</p>
            <p>• Regular gratitude practice can reduce stress by up to 23%</p>
          </div>
        </div>
      </div>
    </div>
  );
} 