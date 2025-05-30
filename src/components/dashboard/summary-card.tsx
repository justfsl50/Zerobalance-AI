
"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  currency?: string; // Keep this if we ever need other currencies, but default will change
  locale?: string; // For specific formatting
  className?: string;
  valueClassName?: string;
}

export function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  currency = "INR", // Default to INR
  locale = "en-IN", // Default to Indian English locale for ₹ formatting
  className, 
  valueClassName 
}: SummaryCardProps) {
  const formattedValue = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{formattedValue}</div>
        {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
      </CardContent>
    </Card>
  );
}
