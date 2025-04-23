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

interface GratitudeImpactChartProps {
  impact: number;
  avgMoodWithGratitude: number;
  avgMoodWithoutGratitude: number;
  withGratitudeDays: number;
  withoutGratitudeDays: number;
  hasEnoughData: boolean;
}

const GratitudeImpactChart: React.FC<GratitudeImpactChartProps> = ({
  impact,
  avgMoodWithGratitude,
  avgMoodWithoutGratitude,
  withGratitudeDays,
  withoutGratitudeDays,
  hasEnoughData,
}) => {
  // Define chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
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
      x: {
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
            const value = context.parsed.y;
            const moodLabels = ["", "Awful", "Bad", "Neutral", "Good", "Great"];
            const moodLabel = value >= 1 && value <= 5 ? moodLabels[Math.round(value)] : "";
            return `Average mood: ${value.toFixed(2)} (${moodLabel})`;
          },
          footer: function (tooltipItems: any) {
            const dataIndex = tooltipItems[0].dataIndex;
            if (dataIndex === 0) {
              return [`Based on ${withGratitudeDays} days with gratitude entries`];
            } else {
              return [`Based on ${withoutGratitudeDays} days without gratitude entries`];
            }
          },
        },
      },
    },
  };

  // Prepare data for bar chart
  const data = {
    labels: ["With Gratitude Practice", "Without Gratitude Practice"],
    datasets: [
      {
        data: [avgMoodWithGratitude, avgMoodWithoutGratitude],
        backgroundColor: [
          "rgba(132, 204, 22, 0.8)",
          "rgba(148, 163, 184, 0.8)",
        ],
        borderColor: [
          "rgba(132, 204, 22, 1)",
          "rgba(148, 163, 184, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Helper function to get impact description
  const getImpactDescription = (): string => {
    if (impact >= 1) return "Strong positive";
    if (impact >= 0.5) return "Moderate positive";
    if (impact >= 0.2) return "Slight positive";
    if (impact > -0.2) return "Minimal";
    if (impact >= -0.5) return "Slight negative";
    if (impact >= -1) return "Moderate negative";
    return "Strong negative";
  };

  const impactDesc = getImpactDescription();
  const impactColor =
    impact >= 0.5
      ? "text-green-600"
      : impact <= -0.5
      ? "text-red-600"
      : "text-amber-600";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 bg-default-50 border-b border-default-200">
        <h3 className="text-lg font-semibold text-default-900">
          Gratitude Practice Impact
        </h3>
        <p className="text-sm text-default-600">
          How gratitude journaling influences your mood
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {hasEnoughData ? (
          <>
            <div className="h-64 mb-4">
              <Bar data={data} options={options} />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                <span className="text-sm font-medium text-default-700">
                  Impact:
                </span>
                <span className={`text-sm font-semibold ${impactColor}`}>
                  {impactDesc} ({impact > 0 ? "+" : ""}
                  {impact.toFixed(2)} points)
                </span>
              </div>

              <div className="border-t border-default-100 pt-3 mt-3">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                    Insight
                  </span>
                  <p className="text-sm text-default-600">
                    {impact >= 0.5
                      ? "Your gratitude practice appears to significantly boost your mood! Aim to maintain this habit."
                      : impact >= 0.2
                      ? "Gratitude journaling seems to have a positive effect on your mood. Consider making it a regular practice."
                      : impact > -0.2
                      ? "The data shows minimal impact from gratitude journaling on your mood so far. Continue recording to see clearer patterns."
                      : "Interestingly, days without gratitude journaling show slightly better moods. Everyone responds differently to wellbeing practices."}
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
                We need at least a week of mood entries with some gratitude
                journal entries to analyse patterns. Keep logging both mood and
                gratitude!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GratitudeImpactChart; 