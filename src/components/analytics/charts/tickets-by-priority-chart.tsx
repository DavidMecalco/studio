
"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { AlertTriangle } from "lucide-react";

interface TicketsByPriorityChartProps {
  data: { name: string; value: number }[];
}

const chartConfig = {
  Alta: { label: "Alta", color: "hsl(var(--destructive))" },
  Media: { label: "Media", color: "hsl(var(--chart-4))" }, // Using chart-4 for yellow/orange-ish
  Baja: { label: "Baja", color: "hsl(var(--chart-5))" },  // Using chart-5 for blue/gray-ish
} satisfies ChartConfig;

const COLORS = [
    chartConfig.Alta.color,
    chartConfig.Media.color,
    chartConfig.Baja.color,
];


export function TicketsByPriorityChart({ data }: TicketsByPriorityChartProps) {
  if (!data || data.every(d => d.value === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary"/> Tickets por Prioridad</CardTitle>
           <CardDescription>Distribución de tickets según su prioridad.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos de prioridad para mostrar.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary"/> Tickets por Prioridad</CardTitle>
        <CardDescription>Distribución de tickets según su prioridad.</CardDescription>
      </CardHeader>
      <CardContent  className="flex items-center justify-center">
        <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
