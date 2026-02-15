import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  TimeScale
);

// Dark theme defaults matching the app
ChartJS.defaults.color = "#8e8ea0";
ChartJS.defaults.borderColor = "#2a2a3e";
ChartJS.defaults.font.family =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
ChartJS.defaults.font.size = 11;

export { ChartJS };
