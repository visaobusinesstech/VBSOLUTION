
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Activity, Zap } from 'lucide-react';

interface TechnologicalChartProps {
  title: string;
  data: Array<{ name: string; value: number; trend?: number }>;
  type?: 'bar' | 'line' | 'area';
  color?: string;
}

const TechnologicalChart = ({ title, data, type = 'bar', color = '#111827' }: TechnologicalChartProps) => {
  const chartConfig = {
    value: {
      label: "Valor",
      color: color,
    },
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 text-xs"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-2 bg-gray-100 rounded-lg">
              {type === 'line' ? (
                <Activity className="h-4 w-4 text-gray-600" />
              ) : type === 'area' ? (
                <TrendingUp className="h-4 w-4 text-gray-600" />
              ) : (
                <Zap className="h-4 w-4 text-gray-600" />
              )}
            </div>
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 relative">
          <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <ChartContainer config={chartConfig} className="h-full">
            {renderChart()}
          </ChartContainer>
        </div>
        
        {/* Grid de métricas */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {data.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length).toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600">Média</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {Math.max(...data.map(item => item.value)).toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600">Pico</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnologicalChart;
