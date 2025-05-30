
"use client";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { useMemo } from "react";
import { format, startOfMonth, eachMonthOfInterval, parseISO, getYear, getMonth } from "date-fns";

interface IncomeVsExpenseChartProps {
  selectedYear: number | "all";
}

export function IncomeVsExpenseChart({ selectedYear }: IncomeVsExpenseChartProps) {
  const { transactions } = useAppContext();

  const chartData = useMemo(() => {
    let relevantTransactions = transactions;

    if (selectedYear !== "all") {
      relevantTransactions = transactions.filter(t => getYear(parseISO(t.date)) === selectedYear);
    }
    
    if (relevantTransactions.length === 0) return [];

    const monthlyData: { [month: string]: { income: number; expense: number } } = {};
    
    const dates = relevantTransactions.map(t => parseISO(t.date));
    let minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    let maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // If a specific year is selected, constrain minDate and maxDate to that year
    if (selectedYear !== "all") {
        const yearStartDate = new Date(selectedYear, 0, 1); // Jan 1st of selected year
        const yearEndDate = new Date(selectedYear, 11, 31); // Dec 31st of selected year
        minDate = dates.filter(d => getYear(d) === selectedYear).reduce((min, d) => d < min ? d : min, yearEndDate);
        minDate = minDate > yearStartDate ? minDate : yearStartDate; // ensure it's at least start of selected year
        maxDate = dates.filter(d => getYear(d) === selectedYear).reduce((max, d) => d > max ? d : max, yearStartDate);
        maxDate = maxDate < yearEndDate ? maxDate : yearEndDate; // ensure it's at most end of selected year

        if (minDate > maxDate && relevantTransactions.length > 0) { // If only one month of data in selected year
          minDate = startOfMonth(dates[0]);
          maxDate = startOfMonth(dates[0]);
        } else if (minDate > maxDate) { // no data in selected year
          return [];
        }
    }
    
    const monthsInRange = eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: startOfMonth(maxDate),
    });

    monthsInRange.forEach(monthDate => {
      const monthKey = format(monthDate, "MMM yyyy");
      monthlyData[monthKey] = { income: 0, expense: 0 };
    });
    
    relevantTransactions.forEach(t => {
      const monthKey = format(parseISO(t.date), "MMM yyyy");
      if (monthlyData[monthKey]) { // Ensure the monthKey exists (it should if monthsInRange is correct)
        if (t.type === 'income') {
          monthlyData[monthKey].income += t.amount;
        } else {
          monthlyData[monthKey].expense += t.amount;
        }
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      
  }, [transactions, selectedYear]);

  const chartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-1))" },
    expense: { label: "Expenses", color: "hsl(var(--chart-2))" },
  };

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Income vs. Expenses Over Time</CardTitle>
          <CardDescription>No data for the selected {selectedYear === "all" ? "period" : selectedYear}.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Add transactions or adjust filter.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Income vs. Expenses Over Time</CardTitle>
        <CardDescription>
          Monthly income and expenses for {selectedYear === "all" ? "all time" : `the year ${selectedYear}`}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
