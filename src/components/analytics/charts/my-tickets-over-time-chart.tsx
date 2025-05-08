
"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Ticket } from "lucide-react";

interface MyTicketsOverTimeChartProps {
  data: { date: string; count: number }[]; // Expects data sorted by date
}

const chartConfig = {
  tickets: {
    label: "Mis Tickets Creados",
    color: "hsl(var(--chart-1))", // Use primary chart color
  },
} satisfies ChartConfig;

export function MyTicketsOverTimeChart({ data }: MyTicketsOverTimeChartProps) {
   if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary"/> Mis Tickets a lo Largo del Tiempo</CardTitle>
          <CardDescription>Tendencia del número de tickets que ha creado.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos de tickets para mostrar.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary"/> Mis Tickets a lo Largo del Tiempo</CardTitle>
        <CardDescription>Tendencia del número de tickets que ha creado.</CardDescription>
      </CardHeader>
      <CardContent>
         <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip content={<ChartTooltipContent indicator="line" hideLabel />} />
              <Line type="monotone" dataKey="count" stroke="var(--color-tickets)" strokeWidth={2} dot={false} name="Tickets Creados" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
