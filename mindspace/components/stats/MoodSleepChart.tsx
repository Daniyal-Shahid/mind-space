import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import { CombinedEntry } from "@/utils/stats";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MoodSleepChartProps {
  dataPoints: {
    date: string;
    moodValue: number;
    sleepHours: number;
    mood?: string;
  }[];
  averages: { hours: number; avgMood: number; count: number }[];
  correlation: number;
  optimalSleepHours: number;
}

const MoodSleepChart: React.FC<MoodSleepChartProps> = ({
  dataPoints,
  averages,
  correlation,
  optimalSleepHours,
}) => {
  // Define chart options
  const options = {
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 6,
        title: {
          display: true,
          text: "Mood Rating",
        },
        ticks: {
          callback: function (value: any) {
            const moodLabels = ["", "Awful", "Bad", "Neutral", "Good", "Great"];
            return moodLabels[value] || "";
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Hours of Sleep",
        },
        min: 0,
        max: 12,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const point = dataPoints[context.dataIndex];
            const date = new Date(point.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            return [
              `Date: ${date}`,
              `Mood: ${point.mood || ""}`,
              `Sleep: ${point.sleepHours} hours`,
            ];
          },
        },
      },
      legend: {
        display: true,
      },
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Prepare data for scatter plot
  const scatterData = {
    datasets: [
      {
        label: "Sleep vs Mood",
        data: dataPoints.map((point) => ({
          x: point.sleepHours,
          y: point.moodValue,
        })),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  };

  // Helper function to determine correlation description
  const getCorrelationDescription = (correlation: number): string => {
    if (correlation >= 0.7) return "Strong positive";
    if (correlation >= 0.4) return "Moderate positive";
    if (correlation >= 0.1) return "Weak positive";
    if (correlation > -0.1) return "No apparent";
    if (correlation >= -0.4) return "Weak negative";
    if (correlation >= -0.7) return "Moderate negative";
    return "Strong negative";
  };

  const correlationDesc = getCorrelationDescription(correlation);
  const correlationColor =
    correlation >= 0.4
      ? "text-green-600"
      : correlation <= -0.4
      ? "text-red-600"
      : "text-amber-600";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 bg-default-50 border-b border-default-200">
        <h3 className="text-lg font-semibold text-default-900">
          Sleep & Mood Correlation
        </h3>
        <p className="text-sm text-default-600">
          How your sleep duration affects your mood
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="h-64 mb-4">
          <Scatter data={scatterData} options={options} />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
            <span className="text-sm font-medium text-default-700">
              Connection:
            </span>
            <span className={`text-sm font-semibold ${correlationColor}`}>
              {correlationDesc} correlation ({correlation.toFixed(2)})
            </span>
          </div>

          {optimalSleepHours > 0 && (
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <span className="text-sm font-medium text-default-700">
                Optimal sleep:
              </span>
              <span className="text-sm font-semibold text-green-600">
                {optimalSleepHours} hours
              </span>
            </div>
          )}

          <div className="border-t border-default-100 pt-3 mt-3">
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                Insight
              </span>
              <p className="text-sm text-default-600">
                {correlation >= 0.3
                  ? `Getting more sleep tends to improve your mood. Aim for ${optimalSleepHours} hours for best results!`
                  : correlation <= -0.3
                  ? `Interestingly, more sleep seems to correlate with lower mood. Your optimal balance appears to be around ${optimalSleepHours} hours.`
                  : `There's no strong pattern between your sleep and mood yet. Keep logging to discover your optimal sleep duration!`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodSleepChart; 