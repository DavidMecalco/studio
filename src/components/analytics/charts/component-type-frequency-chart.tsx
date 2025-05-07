
"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { PieChart as PieIcon } from "lucide-react";

interface ComponentTypeFrequencyChartProps {
  data: { name: string; value: number }[]; // e.g., {name: 'script', value: 10}, {name: 'xml', value: 5}
}

const chartConfig = {
  script: { label: "Scripts (.py)", color: "hsl(var(--chart-1))" },
  xml: { label: "XMLs (.xml)", color: "hsl(var(--chart-2))" },
  report: { label: "Reportes (.rptdesign)", color: "hsl(var(--chart-3))" },
  other: { label: "Otros", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

// Ensure COLORS array matches the order of potential types or use a mapping
const COMPONENT_COLORS = [
  chartConfig.script.color,
  chartConfig.xml.color,
  chartConfig.report.color,
  chartConfig.other.color,
];

export function ComponentTypeFrequencyChart({ data }: ComponentTypeFrequencyChartProps) {
  if (!data || data.every(d => d.value === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieIcon className="h-5 w-5 text-primary"/> Frecuencia por Tipo de Componente</CardTitle>
           <CardDescription>Distribución de tipos de archivos desplegados.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos de componentes para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
      ...item,
      fill: chartConfig[item.name as keyof typeof chartConfig]?.color || chartConfig.other.color // Fallback for unknown types
  }));


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PieIcon className="h-5 w-5 text-primary"/> Frecuencia por Tipo de Componente</CardTitle>
        <CardDescription>Distribución de tipos de archivos desplegados.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
