
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { ServerIcon } from "lucide-react";

interface DeploymentsByEnvironmentChartProps {
  data: { name: string; value: number }[];
}

const chartConfig = {
  deployments: {
    label: "Deployments",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


export function DeploymentsByEnvironmentChart({ data }: DeploymentsByEnvironmentChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ServerIcon className="h-5 w-5 text-primary"/> Despliegues por Ambiente</CardTitle>
          <CardDescription>Número de despliegues en cada ambiente.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos de despliegues para mostrar.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ServerIcon className="h-5 w-5 text-primary"/> Despliegues por Ambiente</CardTitle>
        <CardDescription>Número de despliegues en cada ambiente.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-deployments)" radius={4} name="Deployments" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
