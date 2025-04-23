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

interface MoodWaterChartProps {
  dataPoints: {
    date: string;
    moodValue: number;
    waterCups: number;
    mood?: string;
  }[];
  averages: { cups: number; avgMood: number; count: number }[];
  correlation: number;
  optimalWaterCups: number;
}

const MoodWaterChart: React.FC<MoodWaterChartProps> = ({
  dataPoints,
  averages,
  correlation,
  optimalWaterCups,
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
          text: "Cups of Water",
        },
        min: 0,
        max: Math.max(10, ...dataPoints.map(d => d.waterCups)),
        ticks: {
          stepSize: 1,
        }
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
              `Water: ${point.waterCups} cup${point.waterCups !== 1 ? 's' : ''}`,
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
        label: "Water Intake vs Mood",
        data: dataPoints.map((point) => ({
          x: point.waterCups,
          y: point.moodValue,
        })),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
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
          Hydration & Mood Correlation
        </h3>
        <p className="text-sm text-default-600">
          How your water intake affects your mood
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

          {optimalWaterCups > 0 && (
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <span className="text-sm font-medium text-default-700">
                Optimal water intake:
              </span>
              <span className="text-sm font-semibold text-green-600">
                {optimalWaterCups} cup{optimalWaterCups !== 1 ? 's' : ''}
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
                  ? `Staying hydrated appears to boost your mood. Consider drinking around ${optimalWaterCups} cup${optimalWaterCups !== 1 ? 's' : ''} daily!`
                  : correlation <= -0.3
                  ? `Interestingly, higher water intake correlates with lower mood for you. Find your personal balance, perhaps around ${optimalWaterCups} cup${optimalWaterCups !== 1 ? 's' : ''}.`
                  : `No strong pattern between your water intake and mood yet. Continue tracking to discover your optimal hydration level!`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodWaterChart; 