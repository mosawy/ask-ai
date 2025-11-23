import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Brush
} from 'recharts';
import { VisualizationConfig, ChartType } from '../types';

interface ChartRendererProps {
  config: VisualizationConfig;
}

// Frappe-inspired colors
const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af'];

const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  const { type, data, xAxisKey, seriesKeys } = config;

  const renderChart = () => {
    switch (type) {
      case ChartType.Bar:
        return (
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{fontSize: 12}} />
            <YAxis stroke="#64748b" tick={{fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
              cursor={{fill: '#f1f5f9'}}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {seriesKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
            <Brush dataKey={xAxisKey} height={30} stroke="#cbd5e1" fill="#f8fafc" tick={{fontSize: 10, fill: '#94a3b8'}} />
          </BarChart>
        );
      case ChartType.Line:
        return (
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{fontSize: 12}} />
            <YAxis stroke="#64748b" tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {seriesKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
            <Brush dataKey={xAxisKey} height={30} stroke="#cbd5e1" fill="#f8fafc" tick={{fontSize: 10, fill: '#94a3b8'}} />
          </LineChart>
        );
      case ChartType.Area:
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
             <defs>
              {seriesKeys.map((key, index) => (
                <linearGradient key={`grad-${key}`} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{fontSize: 12}} />
            <YAxis stroke="#64748b" tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {seriesKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]} 
                fillOpacity={1} 
                fill={`url(#color${key})`} 
              />
            ))}
            <Brush dataKey={xAxisKey} height={30} stroke="#cbd5e1" fill="#f8fafc" tick={{fontSize: 10, fill: '#94a3b8'}} />
          </AreaChart>
        );
      case ChartType.Pie:
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={seriesKeys[0]} // Pie charts typically visualize one metric
              nameKey={xAxisKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <Legend />
          </PieChart>
        );
      default:
        return <div>Unsupported Chart Type</div>;
    }
  };

  return (
    <div className="w-full h-64 md:h-80 bg-white rounded-lg p-4 border border-slate-100 shadow-sm mt-4 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{config.title}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;