
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { reviewSubscriptions, type ReviewSubscriptionsInput, type ReviewSubscriptionsOutput } from "@/ai/flows/review-subscriptions-flow";
import { subMonths, format, startOfDay } from "date-fns";
import { Loader2, SearchCheck, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export function SubscriptionReviewer() {
  const { transactions: allTransactions, currentUser } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReviewSubscriptionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodMonths, setSelectedPeriodMonths] = useState<string>("3"); // Default to 3 months

  const handleAnalyzeSubscriptions = async () => {
    if (!currentUser) {
      setError("You need to be logged in to analyze subscriptions.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const months = parseInt(selectedPeriodMonths);
    const toDate = startOfDay(new Date());
    const fromDate = startOfDay(subMonths(toDate, months));

    const filteredTransactions = allTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate && t.type === 'expense';
      })
      .map(t => ({
        description: t.description,
        date: format(new Date(t.date), "yyyy-MM-dd"),
        amount: t.amount,
      }));

    if (filteredTransactions.length === 0) {
      setError(`No expense transactions found in the last ${months} months to analyze.`);
      setIsLoading(false);
      return;
    }
    
    if (filteredTransactions.length < 5 && months > 1) { // Basic heuristic, AI might struggle with too few transactions for pattern detection
        setError(`There are only ${filteredTransactions.length} expense transactions in the last ${months} months. More data usually yields better results.`);
        // We can still proceed, but this is a warning.
    }


    const input: ReviewSubscriptionsInput = {
      transactions: filteredTransactions,
      analysisPeriodMonths: months,
    };

    try {
      const result = await reviewSubscriptions(input);
      setAnalysisResult(result);
    } catch (e: any) {
      console.error("Error analyzing subscriptions:", e);
      setError(e.message || "Failed to analyze subscriptions. The AI might be busy or an unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };


  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="h-6 w-6 text-primary" />
          AI Subscription Reviewer
        </CardTitle>
        <CardDescription>
          Let AI analyze your recent expenses to find potential recurring subscriptions.
          Select a period and click "Analyze".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Select value={selectedPeriodMonths} onValueChange={setSelectedPeriodMonths}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 Month</SelectItem>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyzeSubscriptions} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="mr-2 h-4 w-4" />
            )}
            Analyze Subscriptions
          </Button>
        </div>

        {error && (
          <div className="my-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <strong className="font-semibold">Analysis Error</strong>
            </div>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">AI is analyzing your transactions... This may take a moment.</p>
          </div>
        )}

        {analysisResult && !isLoading && (
          <div className="mt-6">
            {analysisResult.summary && (
                <p className="text-lg font-semibold mb-3">{analysisResult.summary}</p>
            )}
            {analysisResult.potentialSubscriptions.length > 0 ? (
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-4">
                  {analysisResult.potentialSubscriptions.map((sub, index) => (
                    <Card key={index} className="bg-card/80 p-4 shadow-md hover:shadow-lg transition-shadow">
                      <CardTitle className="text-md mb-1">{sub.name}</CardTitle>
                      <div className="text-sm space-y-1">
                        <p><strong>Average Amount:</strong> {formatCurrency(sub.averageAmount)}</p>
                        <p><strong>Estimated Frequency:</strong> {sub.estimatedFrequency}</p>
                        {sub.notes && <p><strong>Notes:</strong> {sub.notes}</p>}
                        <div className="mt-2">
                            <p className="text-xs font-semibold">Confidence: {Math.round(sub.confidence * 100)}%</p>
                            <Progress value={sub.confidence * 100} className="h-2 mt-1" />
                        </div>
                        {sub.supportingEvidence.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold mb-1">Supporting Transactions (Examples):</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground max-h-20 overflow-y-auto">
                              {sub.supportingEvidence.map((desc, i) => (
                                <li key={i} className="truncate">{desc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-6">No potential subscriptions identified in the selected period.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
