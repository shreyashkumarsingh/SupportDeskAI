import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Navbar } from '@/components/Navbar';
import { PageTransition } from '@/components/PageTransition';
import { usePredictions } from '@/hooks/usePredictions';
import { ticketCategories, categoryColors, generateChartData } from '@/utils/mockData';
import { useTheme } from '@/context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const AnalyticsPage: React.FC = () => {
  const { history } = usePredictions();
  const { theme } = useTheme();
  const { categoryData, timeSeriesData } = useMemo(() => generateChartData(history), [history]);

  const isDark = theme === 'dark';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const barChartData = {
    labels: categoryData.map(d => d.category),
    datasets: [
      {
        label: 'Tickets',
        data: categoryData.map(d => d.count),
        backgroundColor: categoryData.map(d => categoryColors[d.category as keyof typeof categoryColors] + '80'),
        borderColor: categoryData.map(d => categoryColors[d.category as keyof typeof categoryColors]),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const pieChartData = {
    labels: categoryData.map(d => d.category),
    datasets: [
      {
        data: categoryData.map(d => d.count),
        backgroundColor: categoryData.map(d => categoryColors[d.category as keyof typeof categoryColors] + 'CC'),
        borderColor: isDark ? '#1a1a2e' : '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  const lineChartData = {
    labels: timeSeriesData.map(d => d.date),
    datasets: [
      {
        label: 'Predictions',
        data: timeSeriesData.map(d => d.predictions),
        fill: true,
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
        borderColor: '#6366f1',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: isDark ? '#1a1a2e' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#fff' : '#000',
        bodyColor: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: textColor,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#fff' : '#000',
        bodyColor: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context: TooltipItem<'line'>) => `${context.parsed.y} predictions`,
        },
      },
    },
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Visualize your prediction trends and category distribution</p>
          </motion.div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tickets by Category</h2>
                  <p className="text-sm text-muted-foreground">Distribution across all categories</p>
                </div>
              </div>
              <div className="h-[300px]">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Category Distribution</h2>
                  <p className="text-sm text-muted-foreground">Percentage breakdown</p>
                </div>
              </div>
              <div className="h-[300px]">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </motion.div>

            {/* Line Chart */}
            <motion.div
              className="glass-card p-6 lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Predictions Over Time</h2>
                  <p className="text-sm text-muted-foreground">Last 7 days trend</p>
                </div>
              </div>
              <div className="h-[300px]">
                <Line data={lineChartData} options={lineOptions} />
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div 
            className="grid sm:grid-cols-3 gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold gradient-text">
                {categoryData.reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Predictions</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold gradient-text">
                {ticketCategories.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Categories Tracked</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold gradient-text">
                {Math.round(timeSeriesData.reduce((sum, d) => sum + d.predictions, 0) / 7)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Daily Predictions</p>
            </div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AnalyticsPage;
