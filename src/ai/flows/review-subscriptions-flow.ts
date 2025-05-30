
'use server';
/**
 * @fileOverview An AI agent to review transactions and identify potential recurring subscriptions.
 *
 * - reviewSubscriptions - A function that analyzes transactions for subscriptions.
 * - ReviewSubscriptionsInput - The input type for the reviewSubscriptions function.
 * - ReviewSubscriptionsOutput - The return type for the reviewSubscriptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionForAISchema = z.object({
  description: z.string().describe("The merchant description of the transaction (e.g., 'NETFLIX.COM', 'Spotify USA')."),
  date: z.string().describe("Transaction date in YYYY-MM-DD format."),
  amount: z.number().describe("The transaction amount."),
});

const IdentifiedSubscriptionSchema = z.object({
  name: z.string().describe("Likely name of the subscription service or recurring payment (e.g., Netflix, Spotify Premium, Monthly Gym Fee). Be concise and use common names."),
  averageAmount: z.number().describe("The typical or average recurring amount for this subscription. If amounts vary, provide an estimate."),
  estimatedFrequency: z.string().describe("Estimated frequency of the payment, e.g., 'Monthly', 'Annually', 'Weekly', 'Bi-weekly'. If unclear, state 'Irregular' or 'Uncertain'."),
  confidence: z.number().min(0).max(1).describe("A confidence score (0.0 to 1.0) indicating how certain you are that this is a recurring subscription or payment."),
  supportingEvidence: z.array(z.string()).describe("A list of 2-3 specific transaction descriptions (from the input) that led to this identification."),
  notes: z.string().optional().describe("Any brief notes or observations about this potential subscription, e.g., if amounts fluctuate, or if it might be a trial period."),
});

const ReviewSubscriptionsInputSchema = z.object({
  transactions: z.array(TransactionForAISchema).describe("A list of transactions to analyze for potential recurring subscriptions. These transactions are typically from the last few months."),
  analysisPeriodMonths: z.number().int().positive().describe("The number of months covered by the provided list of transactions (e.g., 3, 6, 12). This helps in determining frequency."),
});
export type ReviewSubscriptionsInput = z.infer<typeof ReviewSubscriptionsInputSchema>;

const ReviewSubscriptionsOutputSchema = z.object({
  potentialSubscriptions: z.array(IdentifiedSubscriptionSchema).describe("A list of potential recurring subscriptions or payments identified from the transactions. Group similar recurring payments under one subscription name if they appear to be for the same service."),
  summary: z.string().optional().describe("A brief overall summary of the findings or any notable patterns observed, e.g., 'Found 3 potential monthly subscriptions.'"),
});
export type ReviewSubscriptionsOutput = z.infer<typeof ReviewSubscriptionsOutputSchema>;


export async function reviewSubscriptions(input: ReviewSubscriptionsInput): Promise<ReviewSubscriptionsOutput> {
  return reviewSubscriptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewSubscriptionsPrompt',
  input: {schema: ReviewSubscriptionsInputSchema},
  output: {schema: ReviewSubscriptionsOutputSchema},
  prompt: `You are an expert financial analyst specializing in identifying recurring subscriptions and payments from a list of transactions.

Your task is to analyze the provided transaction data and identify potential subscriptions.
The transaction list covers a period of {{{analysisPeriodMonths}}} months.

Consider the following when identifying subscriptions:
- Repetitive merchant names or descriptions (e.g., "Spotify", "NETFLIX.COM", "AWS").
- Consistent payment amounts, or amounts that fall within a typical range for a service.
- Regular payment intervals (monthly, annually, weekly). Watch out for slight date variations.
- Some subscriptions might have slight variations in descriptions (e.g., "Google *Storage", "Google *Services"). Try to group these if they seem to be for the same underlying service.
- Differentiate between one-time purchases and recurring payments.

For each potential subscription, provide:
- A common name for the service.
- The average amount.
- The estimated frequency.
- Your confidence level (0.0 to 1.0).
- A few pieces of supporting transaction descriptions.
- Optional brief notes.

If multiple transactions clearly point to the same subscription (e.g., "Netflix" appearing 3 times for 3 months), list it as ONE subscription with the appropriate frequency and average amount.

Transaction Data:
{{#each transactions}}
- Description: "{{description}}", Date: {{date}}, Amount: {{amount}}
{{/each}}

Please provide your analysis in the specified JSON output format.
`,
});

const reviewSubscriptionsFlow = ai.defineFlow(
  {
    name: 'reviewSubscriptionsFlow',
    inputSchema: ReviewSubscriptionsInputSchema,
    outputSchema: ReviewSubscriptionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI did not return a response for subscription review.");
    }
    return output;
  }
);
