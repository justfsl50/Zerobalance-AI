
import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-transaction.ts';
import '@/ai/flows/manage-transaction-chat-flow.ts';
import '@/ai/flows/review-subscriptions-flow.ts'; // Added new flow

