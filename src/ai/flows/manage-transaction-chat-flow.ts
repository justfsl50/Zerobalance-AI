
'use server';
/**
 * @fileOverview An AI agent to manage transactions via chat.
 *
 * - manageTransactionChat - A function that processes user chat input to manage transactions.
 * - ManageTransactionChatInput - The input type for the manageTransactionChat function.
 * - ChatAction - The output type representing the AI's determined action.
 */

import {z} from 'genkit';
import { format as formatDateFns, parse as parseDateFns, isValid } from 'date-fns';

// Input schema for the flow
const ManageTransactionChatInputSchema = z.object({
  userInput: z.string().describe('The user message from the chat interface.'),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe('List of available transaction categories with their IDs and names. Used for context and mapping AI suggestions.'),
  users: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe('List of available roommates/users with their IDs and names.'),
  currentDate: z.string().describe('The current date in ISO format (e.g., YYYY-MM-DD) to help resolve relative dates like "yesterday" or "last Tuesday".'),
});
export type ManageTransactionChatInput = z.infer<typeof ManageTransactionChatInputSchema>;

// Schemas for specific actions the AI can decide to take (for LLM guidance - "looser" version)
const LLMAddTransactionParamsSchema = z.object({
  userId: z.string().describe("The ID of the user who paid for the transaction, derived from the 'users' input list."),
  description: z.string().describe('A brief description of the transaction (e.g., "Groceries", "Dinner with friends").'),
  amount: z.number().describe('The monetary amount of the transaction. Extract only the number.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. Resolve relative dates like "today", "yesterday", "last Friday" based on the "currentDate" provided in the input. If a year is not specified, assume the current year from "currentDate".'),
  categoryName: z.string().optional().describe("The common name of the transaction category (e.g., 'Groceries', 'Dinner', 'Transportation'). Omit if not determinable from the description."),
  type: z.enum(['income', 'expense']).describe("The type of transaction. If not specified by user as income or earning, assume 'expense'."),
});

const LLMChatActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.enum(['ADD_TRANSACTION']),
    params: LLMAddTransactionParamsSchema,
  }).describe('Use this action when the user wants to record a new transaction.'),
  z.object({
    action: z.enum(['LIST_TRANSACTIONS']),
    params: z.object({
      period: z.string().optional().describe('The period for which to list transactions (e.g., "today", "this month", "last week"). Optional.'),
      user: z.string().optional().describe("Filter by user's name if specified. Optional."),
      category: z.string().optional().describe("Filter by category name if specified. Optional."),
    }),
  }).describe('Use this action when the user wants to see a list of their transactions.'),
  z.object({
    action: z.enum(['CLARIFY']),
    params: z.object({
      clarificationNeeded: z.string().describe('Your question to the user to get missing information (e.g., "Which category should I use for that?", "What was the date of that expense?").'),
    }),
  }).describe('Use this action if crucial information for adding or listing transactions is missing or ambiguous and you need to ask the user for it.'),
  z.object({
    action: z.enum(['INFO']),
    params: z.object({
      aiResponse: z.string().describe('A general helpful message, greeting, or an informative response if the request is not a direct transaction action or if a query is complex (e.g., "Okay, I can help with that." or "For detailed transaction history, please use the filters on the Transactions page.").'),
    }),
  }).describe('Use this action for greetings, general information, or if the user\'s query is too complex for direct action and requires guiding them to existing UI features.'),
  z.object({
    action: z.enum(['ERROR']),
    params: z.object({
      errorMessage: z.string().describe('A message indicating an internal error occurred while processing the request.'),
    }),
  }).describe('Use this action if you encounter an internal problem interpreting the request that is not a clarification issue.'),
]);


// Strict schemas for internal validation after LLM response
const StrictAddTransactionParamsSchema = z.object({
  userId: z.string().min(1),
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().refine(val => isValid(parseDateFns(val, 'yyyy-MM-dd', new Date())), { message: "Invalid date format, expected YYYY-MM-DD" }),
  categoryId: z.string().min(1), // This will be mapped from categoryName
  type: z.enum(['income', 'expense']),
});

const StrictChatActionSchema = z.discriminatedUnion('action', [
  z.object({action: z.literal('ADD_TRANSACTION'), params: StrictAddTransactionParamsSchema}),
  z.object({action: z.literal('LIST_TRANSACTIONS'), params: z.object({ period: z.string().optional(), user: z.string().optional(), category: z.string().optional() }) }),
  z.object({action: z.literal('CLARIFY'), params: z.object({ clarificationNeeded: z.string() }) }),
  z.object({action: z.literal('INFO'), params: z.object({ aiResponse: z.string() }) }),
  z.object({action: z.literal('ERROR'), params: z.object({ errorMessage: z.string() }) }),
]);
export type ChatAction = z.infer<typeof StrictChatActionSchema>;


const systemPromptText = `You are a helpful AI assistant for the ZEROBALANCE personal finance app. Your primary goal is to help users manage their transactions by understanding their natural language input.

You MUST respond with a JSON object matching the 'ChatActionSchema' provided.

Key tasks:
1.  **Add Transaction ('ADD_TRANSACTION')**:
    *   Extract: description, amount (numeric, ignore currency symbols), date (resolve to YYYY-MM-DD), user who paid (match to provided user list and use their ID for 'userId').
    *   Dates: Use the 'currentDate' (provided in YYYY-MM-DD format) to resolve relative dates like "today", "yesterday", "last Friday". Assume current year from 'currentDate' if not specified.
    *   User: The 'users' input provides a list of {id, name}. Match the name mentioned by the user (e.g., "paid by John") to this list and use the corresponding 'id'. If no user is mentioned or identifiable, you may need to CLARIFY.
    *   Category Name: Infer a suitable category name like 'Groceries', 'Utilities', or 'Entertainment' based on the transaction description. If the user specifies a category name, use that. If you cannot determine a category, you can omit the 'categoryName' field in your response for the LLM.
    *   Type: Default to 'expense' unless 'income' or 'earning' is explicitly stated.
    *   If any of these crucial details for adding a transaction are missing or ambiguous (except for categoryName which is optional), use the 'CLARIFY' action.

2.  **List Transactions ('LIST_TRANSACTIONS')**:
    *   If the user asks to see transactions (e.g., "show my expenses", "what did I spend on food last week?").
    *   For now, this action is informational. Respond with an INFO action guiding them to use the app's UI filters. Example: { "action": "INFO", "params": { "aiResponse": "To see your transactions, please use the filters on the Transactions page. You can filter by date, category, and user there!" } }

3.  **Clarify ('CLARIFY')**:
    *   Use this if you need more information to complete an 'ADD_TRANSACTION' request (e.g., missing date, amount, or unclear user).
    *   Your 'clarificationNeeded' message should be a clear question to the user.

4.  **Info ('INFO')**:
    *   For greetings, general acknowledgments, or if the user's query is not directly actionable for adding/listing transactions in a simple way, or if it's better handled by existing UI.
    *   Example for a vague query: { "action": "INFO", "params": { "aiResponse": "I can help you add transactions or tell you how to list them. What would you like to do?" } }

5.  **Error ('ERROR')**:
    *   If you encounter an internal problem interpreting the request that isn't a clarification issue.
`;

import { ai as genkitAIInstance } from '@/ai/genkit';


const prompt = genkitAIInstance.definePrompt({
  name: 'manageTransactionChatPrompt',
  input: {schema: ManageTransactionChatInputSchema},
  output: {schema: LLMChatActionSchema}, 
  prompt: systemPromptText + 
    '\nAvailable Users (name and ID, will be dynamic):\n{{#each users}}\n- {{name}} (ID: {{id}})\n{{/each}}\n\nAvailable Categories (for your general awareness, for ADD_TRANSACTION, infer the name, do not pick an ID from here):\n{{#each categories}}\n- {{name}} (ID: {{id}})\n{{/each}}\n\nCurrent Date (for relative date calculations): {{currentDate}}\n\nUser input: {{{userInput}}}',
});

export async function manageTransactionChat(input: ManageTransactionChatInput): Promise<ChatAction> {
  console.log('[manageTransactionChat Flow] Received input:', JSON.stringify(input, null, 2));

  // Handle empty or whitespace-only input before calling the LLM
  if (!input.userInput || input.userInput.trim() === '') {
    console.log('[manageTransactionChat Flow] User input is empty, returning INFO.');
    return {
      action: 'INFO',
      params: { aiResponse: "Please type a message so I can assist you." },
    };
  }

  try {
    console.log('[manageTransactionChat Flow] Calling LLM prompt...');
    const { output: llmOutput } = await prompt(input);
    console.log('[manageTransactionChat Flow] Received LLM output:', JSON.stringify(llmOutput));


    if (!llmOutput) {
      console.error('[manageTransactionChat Flow] LLM did not return a response.');
      return { action: 'ERROR', params: { errorMessage: 'AI did not return a response.' } };
    }

    if (llmOutput.action === 'ADD_TRANSACTION') {
      let resolvedCategoryId = '';
      const otherCategory = input.categories.find(c => c.name.toLowerCase() === 'other');
      const defaultCategoryId = otherCategory ? otherCategory.id : (input.categories.length > 0 ? input.categories[0].id : 'other'); 


      if (llmOutput.params.categoryName) {
        const llmCategoryName = llmOutput.params.categoryName.trim().toLowerCase();
        const matchedCategory = input.categories.find(c => c.name.toLowerCase() === llmCategoryName);
        if (matchedCategory) {
          resolvedCategoryId = matchedCategory.id;
        } else {
          // If AI suggests a category name not in the list, use the default "Other"
          console.log(`[manageTransactionChat Flow] AI suggested category "${llmOutput.params.categoryName}" not found, defaulting to "${defaultCategoryId}".`);
          resolvedCategoryId = defaultCategoryId;
        }
      } else {
        // If AI doesn't suggest a category name, use the default "Other"
        console.log('[manageTransactionChat Flow] AI did not suggest a category name, defaulting to "Other".');
        resolvedCategoryId = defaultCategoryId;
      }

      const transactionDataForValidation = {
        userId: llmOutput.params.userId,
        description: llmOutput.params.description,
        amount: llmOutput.params.amount,
        date: llmOutput.params.date,
        type: llmOutput.params.type || 'expense',
        categoryId: resolvedCategoryId,
      };
      
      console.log('[manageTransactionChat Flow] Validating ADD_TRANSACTION params:', JSON.stringify(transactionDataForValidation));
      const validatedAction = StrictChatActionSchema.safeParse({
        action: 'ADD_TRANSACTION',
        params: transactionDataForValidation,
      });

      if (validatedAction.success) {
        console.log('[manageTransactionChat Flow] ADD_TRANSACTION validated successfully.');
        return validatedAction.data;
      } else {
        console.error("[manageTransactionChat Flow] ADD_TRANSACTION LLM output validation error:", validatedAction.error.flatten());
         let missing = [];
         if (!transactionDataForValidation.userId) missing.push('who paid');
         if (!transactionDataForValidation.description) missing.push('description');
         if (transactionDataForValidation.amount === undefined || transactionDataForValidation.amount <=0) missing.push('amount');
         if (!transactionDataForValidation.date || !isValid(parseDateFns(transactionDataForValidation.date, 'yyyy-MM-dd', new Date()))) missing.push('date');
         
         if (missing.length > 0) {
            console.log(`[manageTransactionChat Flow] Missing details for ADD_TRANSACTION: ${missing.join(', ')}. Returning CLARIFY.`);
            return { action: 'CLARIFY', params: { clarificationNeeded: `I'm missing some details for the transaction: ${missing.join(', ')}. Could you please provide them?` } };
         }
        console.log('[manageTransactionChat Flow] ADD_TRANSACTION validation failed, returning ERROR.');
        return {
          action: 'ERROR',
          params: { errorMessage: `AI response for adding transaction was not in the expected format. Details: ${validatedAction.error.message}` },
        };
      }
    }

    // For other actions (LIST_TRANSACTIONS, CLARIFY, INFO, ERROR)
    console.log(`[manageTransactionChat Flow] Validating ${llmOutput.action} action:`, JSON.stringify(llmOutput));
    const validatedAction = StrictChatActionSchema.safeParse(llmOutput);
    if (validatedAction.success) {
      console.log(`[manageTransactionChat Flow] ${llmOutput.action} validated successfully.`);
      return validatedAction.data;
    } else {
      console.error("[manageTransactionChat Flow] LLM output validation error (non-ADD action):", validatedAction.error.flatten());
      console.log(`[manageTransactionChat Flow] ${llmOutput.action} validation failed, returning ERROR.`);
      return {
        action: 'ERROR',
        params: { errorMessage: `AI response was not in the expected format. Details: ${validatedAction.error.message}` },
      };
    }

  } catch (error: any) {
    console.error('[manageTransactionChat Flow] Error in flow:', error);
    return { action: 'ERROR', params: { errorMessage: error.message || 'An unexpected error occurred.' } };
  }
}
