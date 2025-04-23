import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface WaterEntryProps {
  initialData: any;
  onChange: (data: any) => void;
  isDisabled: boolean;
}

export default function WaterEntry({
  initialData,
  onChange,
  isDisabled,
}: WaterEntryProps) {
  // State for water intake in cups
  const [cups, setCups] = useState<number>(
    initialData?.cups || 4
  );

  // Pass data up to parent component whenever values change
  useEffect(() => {
    onChange({
      id: initialData?.id,
      cups,
    });
  }, [cups, initialData?.id]);

  const handleCupsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setCups(value);
  };

  const incrementCups = () => {
    setCups(prev => Math.min(prev + 1, 12));
  };

  const decrementCups = () => {
    setCups(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-default-800 font-medium">Water Intake</h3>
      
      <div className="space-y-6">
        {/* Visual water cups representation */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-end justify-center gap-2 h-32 mb-4">
            {Array.from({ length: Math.min(8, cups) }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [0, 40 + (i * 5)] }}
                className="w-8 bg-blue-400/70 rounded-t-lg"
                initial={{ height: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.1,
                  ease: "easeOut" 
                }}
              />
            ))}

            {cups > 8 && (
              <div className="text-blue-500 font-medium">+{cups - 8}</div>
            )}
          </div>
          
          <div className="text-2xl font-bold text-default-800">
            {cups} cup{cups !== 1 ? 's' : ''}
          </div>
          
          <p className="text-default-600 text-sm mt-1">
            {cups < 4 
              ? "Try to drink more water! You can do it :D" 
              : cups >= 8 && cups <= 9
                ? "Great job staying hydrated!" 
                : cups >= 10 && cups <= 12
                  ? "Amazing job!"
                  : "Good hydration level, keep it up!"}
          </p>
        </div>

        {/* Cup counter with buttons */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center text-default-700 disabled:opacity-50"
            disabled={isDisabled || cups <= 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={decrementCups}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </motion.button>
          
          <input
            className="w-16 text-center p-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isDisabled}
            max={12}
            min={0}
            type="number"
            value={cups}
            onChange={handleCupsChange}
          />
          
          <motion.button
            className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center text-default-700 disabled:opacity-50"
            disabled={isDisabled || cups >= 12}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={incrementCups}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </motion.button>
        </div>
        
        {/* Slider for quick adjustment */}
        <div>
          <input
            className="w-full appearance-none bg-default-200 rounded-lg h-2"
            disabled={isDisabled}
            max="12"
            min="0"
            step="1"
            type="range"
            value={cups}
            onChange={handleCupsChange}
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>0</span>
            <span>4</span>
            <span>8</span>
            <span>12</span>
          </div>
        </div>

        {/* Water intake information */}
        <div className="bg-white/50 p-4 rounded-lg">
          <h4 className="text-default-700 text-sm font-medium mb-2">Hydration Tips</h4>
          <div className="text-xs space-y-1 text-default-600">
            <p>• A standard cup is about 250ml</p>
            <p>• Try to drink at least 8 cups (2 litres) of water daily</p>
            <p>• Drinking water improves energy, cognition and mood</p>
            <p>• Create reminders to drink water throughout the day</p>
          </div>
        </div>
      </div>
    </div>
  );
} 