// src/ai/flows/categorize-transaction.ts
'use server';
/**
 * @fileOverview AI agent to suggest spending categories for transactions based on descriptions.
 *
 * - categorizeTransaction - A function that suggests a spending category for a given transaction description.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the transaction, e.g., \'Coffee at Starbucks\'.'),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The suggested spending category for the transaction, e.g., \'Food & Dining\'.'
    ),
  confidence: z
    .number()
    .describe(
      'A number between 0 and 1 indicating the confidence level in the suggested category.'
    ),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are a personal finance expert. Your task is to categorize transactions based on their description.

  Given the following transaction description, suggest a spending category and a confidence level (0 to 1) for your suggestion.

  Description: {{{description}}}

  Respond with a JSON object that contains the category and confidence level.
  `,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
