
"use client";

import { useState } from "react";
import { SpendingByCategoryChart } from "@/components/reports/spending-by-category-chart";
import { IncomeVsExpenseChart } from "@/components/reports/income-vs-expense-chart";
import { MonthYearControls } from "@/components/ui/month-year-controls";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getMonth, getYear, parseISO, format as formatDateFns } from "date-fns"; // Renamed to avoid conflict
import { useAppContext } from "@/contexts/AppContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SubscriptionReviewer } from "@/components/reports/subscription-reviewer"; // Import new component
import { Separator } from "@/components/ui/separator";


export default function ReportsPage() {
  const { transactions, categories, users, getUserById } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(getMonth(new Date())); 
  const [selectedYear, setSelectedYear] = useState<number | "all">(getYear(new Date())); 

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const generateExpenseReportPDF = () => {
    const doc = new jsPDF();
    
    let reportTitle = "Expense Report";
    let fileName = "expense-report";

    if (selectedYear !== "all") {
      const yearStr = String(selectedYear);
      reportTitle += ` - ${yearStr}`;
      fileName += `-${yearStr}`;
      if (selectedMonth !== "all") {
        const monthStr = formatDateFns(new Date(selectedYear, selectedMonth as number), "MMMM");
        reportTitle += ` ${monthStr}`;
        fileName += `-${formatDateFns(new Date(selectedYear, selectedMonth as number), "MM")}`;
      } else {
        reportTitle += " (All Months)";
        fileName += "-all-months";
      }
    } else {
       reportTitle += " (All Time)";
       fileName += "-all-time";
    }
    fileName += ".pdf";

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDateFns(new Date(), "PPP p")}`, 14, 30);


    const filteredTransactions = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (selectedYear === "all" && selectedMonth === "all") return true;

      const transactionDate = parseISO(t.date);
      const transactionYear = getYear(transactionDate);
      const transactionMonth = getMonth(transactionDate);

      const yearMatch = selectedYear === "all" || transactionYear === selectedYear;
      if (!yearMatch) return false;
      
      const monthMatch = selectedMonth === "all" || transactionMonth === selectedMonth;
      return monthMatch;
    });

    const spendingByUserAndCategory: { [userName: string]: { [categoryName: string]: number } } = {};
    let grandTotal = 0;

    filteredTransactions.forEach(t => {
        const user = getUserById(t.userId);
        const category = categories.find(c => c.id === t.categoryId);
        if (user && category) {
            const userName = user.name;
            const categoryName = category.name;
            if (!spendingByUserAndCategory[userName]) {
                spendingByUserAndCategory[userName] = {};
            }
            spendingByUserAndCategory[userName][categoryName] = (spendingByUserAndCategory[userName][categoryName] || 0) + t.amount;
            grandTotal += t.amount;
        }
    });
    
    const tableBody: any[] = [];
    // let userRowSpan = 0; // Not needed with current structure

    Object.entries(spendingByUserAndCategory).forEach(([userName, categoriesData]) => {
      const numCategoriesForUser = Object.keys(categoriesData).length;
      let isFirstCategory = true;
      Object.entries(categoriesData).forEach(([categoryName, amount]) => {
        if (isFirstCategory) {
          tableBody.push([
            { content: userName, rowSpan: numCategoriesForUser, styles: { valign: 'middle', halign: 'center' } },
            categoryName,
            formatCurrency(amount)
          ]);
          isFirstCategory = false;
        } else {
          tableBody.push([ // User name cell is skipped due to rowSpan
            categoryName, 
            formatCurrency(amount)
          ]);
        }
      });
    });
    
    if (tableBody.length > 0) {
        autoTable(doc, {
            startY: 40,
            head: [['User', 'Category', 'Amount']],
            body: tableBody,
            theme: 'striped',
            didDrawCell: (data) => {
                // Custom styling if needed
            },
            foot: [['Total', '', formatCurrency(grandTotal)]],
            footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        });
    } else {
        doc.text("No expense data available for the selected period.", 14, 40);
    }


    doc.save(fileName);
  };


  return (
    <div className="container mx-auto py-2 space-y-8"> {/* Added space-y-8 for overall spacing */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <MonthYearControls
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              allowAllMonths={true} 
              allowAllYears={true}  
              monthLabel="Report Month"
              yearLabel="Report Year"
            />
           <Button onClick={generateExpenseReportPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <SpendingByCategoryChart selectedMonth={selectedMonth} selectedYear={selectedYear} />
        <IncomeVsExpenseChart selectedYear={selectedYear} /> 
      </div>
      
      <Separator className="my-8" /> {/* Added Separator */}

      <SubscriptionReviewer /> {/* Add the new component */}
    </div>
  );
}
