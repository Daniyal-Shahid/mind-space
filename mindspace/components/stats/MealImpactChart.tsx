import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MealPattern {
  meal: string;
  occurrences: number;
  avgMood: number;
}

interface MealImpactChartProps {
  mealPatterns: MealPattern[];
  hasEnoughData: boolean;
}

const MealImpactChart: React.FC<MealImpactChartProps> = ({
  mealPatterns,
  hasEnoughData,
}) => {
  // Only show top 5 meals for clarity
  const topMeals = mealPatterns.slice(0, 5);

  // Define chart options
  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: false,
        min: 1,
        max: 5,
        title: {
          display: true,
          text: "Average Mood Rating",
        },
        ticks: {
          callback: function (value: any) {
            const moodLabels = ["", "Awful", "Bad", "Neutral", "Good", "Great"];
            return moodLabels[value] || "";
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const mealPattern = topMeals[context.dataIndex];
            const moodLabels = ["", "Awful", "Bad", "Neutral", "Good", "Great"];
            const moodLabel = mealPattern.avgMood >= 1 && mealPattern.avgMood <= 5 
              ? moodLabels[Math.round(mealPattern.avgMood)] 
              : "";
            
            return [
              `Average mood: ${mealPattern.avgMood.toFixed(2)} (${moodLabel})`,
              `Occurrences: ${mealPattern.occurrences} times`,
            ];
          },
        },
      },
    },
  };

  // Helper function to get mood-based color
  const getMoodColor = (mood: number): string => {
    if (mood >= 4.5) return "rgba(74, 222, 128, 0.8)"; // Bright green
    if (mood >= 4) return "rgba(132, 204, 22, 0.8)"; // Green
    if (mood >= 3.5) return "rgba(250, 204, 21, 0.8)"; // Yellow
    if (mood >= 3) return "rgba(251, 146, 60, 0.8)"; // Orange
    return "rgba(248, 113, 113, 0.8)"; // Red
  };

  // Prepare data for bar chart
  const data = {
    labels: topMeals.map(m => m.meal),
    datasets: [
      {
        data: topMeals.map(m => m.avgMood),
        backgroundColor: topMeals.map(m => getMoodColor(m.avgMood)),
        borderColor: topMeals.map(m => getMoodColor(m.avgMood).replace("0.8", "1")),
        borderWidth: 1,
      },
    ],
  };

  const bestMeal = topMeals.length > 0 ? topMeals[0] : null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 bg-default-50 border-b border-default-200">
        <h3 className="text-lg font-semibold text-default-900">
          Meals & Mood Analysis
        </h3>
        <p className="text-sm text-default-600">
          Which foods correlate with your best moods
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {hasEnoughData && topMeals.length > 0 ? (
          <>
            <div className="h-64 mb-4">
              <Bar data={data} options={options} />
            </div>

            <div className="mt-4 space-y-2">
              {bestMeal && (
                <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                  <span className="text-sm font-medium text-default-700">
                    Top mood booster:
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {bestMeal.meal}
                  </span>
                </div>
              )}

              <div className="border-t border-default-100 pt-3 mt-3">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                    Insight
                  </span>
                  <p className="text-sm text-default-600">
                    {bestMeal
                      ? `"${bestMeal.meal}" appears to correlate with your highest mood ratings. Consider including this in your meals more frequently!`
                      : "We're still analysing your meal patterns. Keep logging to discover which foods boost your mood!"}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 flex-col">
            <div className="text-center p-4 rounded-lg bg-blue-50 max-w-md">
              <p className="text-blue-800 font-medium">
                Not enough data yet
              </p>
              <p className="text-sm text-blue-600 mt-1">
                We need at least 2 weeks of food and mood entries to analyse meal patterns.
                Keep recording what you eat and how you feel!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealImpactChart; 