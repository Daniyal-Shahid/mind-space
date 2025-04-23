import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";

interface SleepEntryProps {
  initialData: any;
  onChange: (data: any) => void;
  isDisabled: boolean;
}

export default function SleepEntry({
  initialData,
  onChange,
  isDisabled,
}: SleepEntryProps) {
  // Sleep duration in hours
  const [hoursSlept, setHoursSlept] = useState<number>(
    initialData?.hours_slept || 8
  );
  
  // Sleep quality on a scale of 1-10
  const [sleepQuality, setSleepQuality] = useState<number>(
    initialData?.sleep_quality || 7
  );

  // Pass data up to parent component whenever values change
  useEffect(() => {
    onChange({
      id: initialData?.id,
      hours_slept: hoursSlept,
      sleep_quality: sleepQuality,
    });
  }, [hoursSlept, sleepQuality, initialData?.id]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setHoursSlept(value);
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSleepQuality(value);
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-default-800 font-medium">Sleep</h3>
      
      <div className="space-y-4">
        {/* Hours slept */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-default-700 text-sm font-medium">
              Hours Slept
            </label>
            <span className="text-default-600 text-sm font-medium">
              {hoursSlept} hours
            </span>
          </div>
          <input
            className="w-full appearance-none bg-default-200 rounded-lg h-2"
            disabled={isDisabled}
            max="12"
            min="0"
            step="0.5"
            type="range"
            value={hoursSlept}
            onChange={handleHoursChange}
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
          </div>
        </div>

        {/* Sleep quality */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-default-700 text-sm font-medium">
              Sleep Quality
            </label>
            <span className="text-default-600 text-sm font-medium">
              {sleepQuality}/10
            </span>
          </div>
          <input
            className="w-full appearance-none bg-default-200 rounded-lg h-2"
            disabled={isDisabled}
            max="10"
            min="1"
            step="1"
            type="range"
            value={sleepQuality}
            onChange={handleQualityChange}
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>Poor</span>
            <span>Average</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Sleep quality descriptions */}
        <div className="bg-white/50 p-4 rounded-lg mt-4">
          <h4 className="text-default-700 text-sm font-medium mb-2">Sleep Quality Guide</h4>
          <div className="text-xs space-y-1 text-default-600">
            <p>1-3: Poor sleep, frequently waking up, feeling unrested</p>
            <p>4-6: Average sleep, some interruptions, moderately rested</p>
            <p>7-8: Good sleep, minimal disruptions, feeling rested</p>
            <p>9-10: Excellent sleep, uninterrupted, feeling fully refreshed</p>
          </div>
        </div>
      </div>
    </div>
  );
} 