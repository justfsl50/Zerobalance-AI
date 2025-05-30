
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { useMemo } from "react";
import { getMonth, getYear, parseISO } from 'date-fns';

interface SpendingByCategoryChartProps {
  selectedMonth: number | "all";
  selectedYear: number | "all";
}

export function SpendingByCategoryChart({ selectedMonth, selectedYear }: SpendingByCategoryChartProps) {
  const { transactions, categories } = useAppContext();

  const chartData = useMemo(() => {
    const spending: { [key: string]: number } = {};
    
    const filteredTransactions = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (selectedYear === "all") return true; // Show all if "all years"

      const transactionDate = parseISO(t.date);
      const transactionYear = getYear(transactionDate);
      const transactionMonth = getMonth(transactionDate);

      const yearMatch = transactionYear === selectedYear;
      if (!yearMatch) return false;
      
      const monthMatch = selectedMonth === "all" || transactionMonth === selectedMonth;
      return monthMatch;
    });
    
    filteredTransactions.forEach(t => {
        const category = categories.find(c => c.id === t.categoryId);
        if (category) {
          spending[category.name] = (spending[category.name] || 0) + t.amount;
        }
    });

    return Object.entries(spending)
      .map(([name, amount]) => ({ 
        name, 
        amount,
        fill: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))',
      }))
      .sort((a,b) => b.amount - a.amount);
  }, [transactions, categories, selectedMonth, selectedYear]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    chartData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);


  if (chartData.length === 0) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>No expense data for the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Add expenses or adjust filter.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Expenses across categories for the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ right: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent />}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
