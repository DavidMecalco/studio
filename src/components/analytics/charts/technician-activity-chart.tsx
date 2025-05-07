
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Users } from "lucide-react";

interface TechnicianActivityChartProps {
  data: { name: string; ticketsResolved: number; commitsMade: number }[];
}

const chartConfig = {
  ticketsResolved: {
    label: "Tickets Resueltos",
    color: "hsl(var(--chart-1))",
  },
  commitsMade: {
    label: "Commits Realizados",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function TechnicianActivityChart({ data }: TechnicianActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Actividad de Técnicos</CardTitle>
          <CardDescription>Comparación de tickets resueltos y commits por técnico.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos de actividad para mostrar.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Actividad de Técnicos</CardTitle>
        <CardDescription>Comparación de tickets resueltos y commits por técnico.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8}/>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="ticketsResolved" fill="var(--color-ticketsResolved)" radius={4} />
              <Bar dataKey="commitsMade" fill="var(--color-commitsMade)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
