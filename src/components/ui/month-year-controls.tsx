
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, getYear, getMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthYearControlsProps {
  selectedMonth: number | "all"; // 0-11 or "all"
  selectedYear: number | "all"; // e.g., 2023 or "all"
  onMonthChange: (month: number | "all") => void;
  onYearChange: (year: number | "all") => void;
  monthLabel?: string;
  yearLabel?: string;
  allowAllMonths?: boolean;
  allowAllYears?: boolean;
  yearRange?: number; // Number of years before and after current year to display
  className?: string; // Added className prop
}

export function MonthYearControls({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  monthLabel = "Month",
  yearLabel = "Year",
  allowAllMonths = false,
  allowAllYears = false,
  yearRange = 5,
  className, // Destructure className
}: MonthYearControlsProps) {
  const currentYear = getYear(new Date());
  const years = Array.from({ length: yearRange * 2 + 1 }, (_, i) => currentYear - yearRange + i);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i, // 0-11
    label: format(new Date(currentYear, i, 1), "MMMM"), // Use currentYear for formatting, month index is key
  }));

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 items-end", className)}> {/* Use cn to merge classes */}
      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <Label htmlFor={`month-select-${monthLabel.toLowerCase().replace(/\s/g, '-')}`}>{monthLabel}</Label>
        <Select
          value={selectedMonth === "all" ? "all" : String(selectedMonth)}
          onValueChange={(value) => onMonthChange(value === "all" ? "all" : parseInt(value))}
        >
          <SelectTrigger id={`month-select-${monthLabel.toLowerCase().replace(/\s/g, '-')}`} className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder={`Select ${monthLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {allowAllMonths && <SelectItem value="all">All Months</SelectItem>}
            {months.map((month) => (
              <SelectItem key={month.value} value={String(month.value)}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <Label htmlFor={`year-select-${yearLabel.toLowerCase().replace(/\s/g, '-')}`}>{yearLabel}</Label>
        <Select
          value={selectedYear === "all" ? "all" : String(selectedYear)}
          onValueChange={(value) => onYearChange(value === "all" ? "all" : parseInt(value))}
        >
          <SelectTrigger id={`year-select-${yearLabel.toLowerCase().replace(/\s/g, '-')}`} className="w-full sm:w-[120px] bg-background">
            <SelectValue placeholder={`Select ${yearLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {allowAllYears && <SelectItem value="all">All Years</SelectItem>}
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {String(year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
