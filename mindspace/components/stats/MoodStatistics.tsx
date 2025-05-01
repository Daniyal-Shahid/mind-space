import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import { 
  fetchSleepEntries, 
  fetchFoodEntries, 
  fetchWaterEntries, 
  fetchGratitudeEntries 
} from "@/utils/entries";
import { fetchMoodEntries } from "@/utils/mood";
import { 
  combineDailyEntries, 
  calculateMoodSleepCorrelation, 
  calculateMoodWaterCorrelation,
  calculateGratitudeImpact,
  analyzeMealImpact
} from "@/utils/stats";

import MoodSleepChart from "./MoodSleepChart";
import MoodWaterChart from "./MoodWaterChart";
import GratitudeImpactChart from "./GratitudeImpactChart";
import MealImpactChart from "./MealImpactChart";

const MoodStatistics: React.FC = () => {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for each analysis
  const [sleepCorrelation, setSleepCorrelation] = useState<any>({
    hasEnoughData: false,
    correlation: 0,
    optimalSleepHours: 0,
    dataPoints: [],
    averages: []
  });
  
  const [waterCorrelation, setWaterCorrelation] = useState<any>({
    hasEnoughData: false,
    correlation: 0,
    optimalWaterCups: 0,
    dataPoints: [],
    averages: []
  });
  
  const [gratitudeImpact, setGratitudeImpact] = useState<any>({
    hasEnoughData: false,
    impact: 0,
    avgMoodWithGratitude: 0,
    avgMoodWithoutGratitude: 0,
    withGratitudeDays: 0,
    withoutGratitudeDays: 0
  });
  
  const [mealImpact, setMealImpact] = useState<any>({
    hasEnoughData: false,
    mealPatterns: []
  });

  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("3m");
  
  // Check authentication
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace({
        pathname: '/auth/login',
        query: { returnUrl: '/mood-tracker' },
      });
    }
  }, [session, authLoading, router]);
  
  useEffect(() => {
    // Only load data if authenticated
    if (authLoading || !session) return;
    
    async function loadAndAnalyzeData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Calculate date range based on selected timeRange
        const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD
        let startDate: string;
        
        const today = new Date();
        if (timeRange === "1m") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          startDate = lastMonth.toISOString().split('T')[0];
        } else if (timeRange === "3m") {
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(today.getMonth() - 3);
          startDate = threeMonthsAgo.toISOString().split('T')[0];
        } else if (timeRange === "6m") {
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(today.getMonth() - 6);
          startDate = sixMonthsAgo.toISOString().split('T')[0];
        } else { // 1y
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          startDate = oneYearAgo.toISOString().split('T')[0];
        }
        
        // Fetch all entry types
        const [moodEntries, sleepEntries, foodEntries, waterEntries, gratitudeEntries] = 
          await Promise.all([
            fetchMoodEntries({ startDate, endDate }),
            fetchSleepEntries({ startDate, endDate }),
            fetchFoodEntries({ startDate, endDate }),
            fetchWaterEntries({ startDate, endDate }),
            fetchGratitudeEntries({ startDate, endDate })
          ]);
        
        // Combine entries by date for analysis
        const combinedEntries = combineDailyEntries(
          Array.isArray(moodEntries) ? moodEntries : [],
          Array.isArray(sleepEntries) ? sleepEntries : [],
          Array.isArray(waterEntries) ? waterEntries : [],
          Array.isArray(foodEntries) ? foodEntries : [],
          Array.isArray(gratitudeEntries) ? gratitudeEntries : []
        );
        
        // Calculate statistics
        const sleepResults = calculateMoodSleepCorrelation(combinedEntries);
        const waterResults = calculateMoodWaterCorrelation(combinedEntries);
        const gratitudeResults = calculateGratitudeImpact(combinedEntries);
        const mealResults = analyzeMealImpact(combinedEntries, foodEntries);
        
        // Update state with results
        setSleepCorrelation(sleepResults);
        setWaterCorrelation(waterResults);
        setGratitudeImpact(gratitudeResults);
        setMealImpact(mealResults);
        
      } catch (err) {
        console.error("Error analyzing mood data:", err);
        
        if (err instanceof Error && err.message.includes("must be logged in")) {
          // Authentication error - redirect to login
          router.push({
            pathname: '/auth/login',
            query: { returnUrl: '/mood-tracker' },
          });
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to analyze mood data"
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAndAnalyzeData();
  }, [timeRange, session, authLoading, router]);
  
  // Generate summary badge/insights
  const getBadge = () => {
    // Check if we have enough data for any analysis
    if (!sleepCorrelation.hasEnoughData && 
        !waterCorrelation.hasEnoughData && 
        !gratitudeImpact.hasEnoughData && 
        !mealImpact.hasEnoughData) {
      return null;
    }
    
    // Find most significant insight
    let badges = [];
    
    if (sleepCorrelation.hasEnoughData && sleepCorrelation.correlation >= 0.4 && sleepCorrelation.optimalSleepHours) {
      badges.push({
        title: `Best mood after ${sleepCorrelation.optimalSleepHours}h sleep 🌙`,
        description: `You tend to feel your best after sleeping around ${sleepCorrelation.optimalSleepHours} hours`,
        strength: sleepCorrelation.correlation * 5
      });
    }
    
    if (waterCorrelation.hasEnoughData && waterCorrelation.correlation >= 0.4 && waterCorrelation.optimalWaterCups) {
      badges.push({
        title: `Hydration hero: ${waterCorrelation.optimalWaterCups} cups 💧`,
        description: `Your mood improves significantly with ${waterCorrelation.optimalWaterCups} cups of water daily`,
        strength: waterCorrelation.correlation * 5
      });
    }
    
    if (gratitudeImpact.hasEnoughData && gratitudeImpact.impact >= 0.5) {
      badges.push({
        title: "Gratitude boosts your mood 🙏",
        description: "On days when you practice gratitude, your mood is noticeably better",
        strength: gratitudeImpact.impact * 4
      });
    }
    
    if (mealImpact.hasEnoughData && mealImpact.mealPatterns.length > 0) {
      const bestMeal = mealImpact.mealPatterns[0];
      if (bestMeal && bestMeal.avgMood >= 4) {
        badges.push({
          title: `Mood food: ${bestMeal.meal} 🍀`,
          description: `"${bestMeal.meal}" appears to boost your mood consistently`,
          strength: (bestMeal.avgMood - 2.5) * 3
        });
      }
    }
    
    // Return strongest badge or null if no significant insights
    if (badges.length > 0) {
      badges.sort((a, b) => b.strength - a.strength);
      return badges[0];
    }
    
    return null;
  };
  
  const badge = getBadge();
  
  // If still loading auth, show loading spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated (and still in this component), show a message
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-default-700 mb-4">Please log in to view your wellbeing insights</p>
        <Button 
          color="primary"
          onPress={() => router.push('/auth/login?returnUrl=/mood-tracker')}
        >
          Log In
        </Button>
      </div>
    );
  }
  
  return (
    <div className="pt-8 pb-12">
      <div className="mb-6 flex justify-between flex-wrap gap-4 items-center">
        <h2 className="text-2xl font-bold text-default-900">
          Wellbeing Insights
        </h2>
        <div className="flex gap-2">
          <Button
            color={timeRange === "1m" ? "primary" : "default"}
            size="sm"
            variant={timeRange === "1m" ? "solid" : "flat"}
            onClick={() => setTimeRange("1m")}
          >
            1 Month
          </Button>
          <Button
            color={timeRange === "3m" ? "primary" : "default"}
            size="sm"
            variant={timeRange === "3m" ? "solid" : "flat"}
            onClick={() => setTimeRange("3m")}
          >
            3 Months
          </Button>
          <Button
            color={timeRange === "6m" ? "primary" : "default"}
            size="sm"
            variant={timeRange === "6m" ? "solid" : "flat"}
            onClick={() => setTimeRange("6m")}
          >
            6 Months
          </Button>
          <Button
            color={timeRange === "1y" ? "primary" : "default"}
            size="sm"
            variant={timeRange === "1y" ? "solid" : "flat"}
            onClick={() => setTimeRange("1y")}
          >
            1 Year
          </Button>
        </div>
      </div>
      
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
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          {/* Badge highlight if available */}
          {badge && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full">
                  <svg 
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">{badge.title}</h3>
                  <p className="text-default-600">{badge.description}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoodSleepChart 
              dataPoints={sleepCorrelation.dataPoints || []}
              averages={sleepCorrelation.averages || []}
              correlation={sleepCorrelation.correlation}
              optimalSleepHours={sleepCorrelation.optimalSleepHours}
            />
            
            <MoodWaterChart 
              dataPoints={waterCorrelation.dataPoints || []}
              averages={waterCorrelation.averages || []}
              correlation={waterCorrelation.correlation}
              optimalWaterCups={waterCorrelation.optimalWaterCups}
            />
            
            <GratitudeImpactChart 
              impact={gratitudeImpact.impact}
              avgMoodWithGratitude={gratitudeImpact.avgMoodWithGratitude}
              avgMoodWithoutGratitude={gratitudeImpact.avgMoodWithoutGratitude}
              withGratitudeDays={gratitudeImpact.withGratitudeDays}
              withoutGratitudeDays={gratitudeImpact.withoutGratitudeDays}
              hasEnoughData={gratitudeImpact.hasEnoughData}
            />
            
            <MealImpactChart 
              mealPatterns={mealImpact.mealPatterns || []}
              hasEnoughData={mealImpact.hasEnoughData}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MoodStatistics; 