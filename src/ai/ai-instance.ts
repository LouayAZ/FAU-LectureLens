// src/ai/ai-instance.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { nextPlugin } from '@genkit-ai/next'; // Correct import

export const ai = genkit({
  plugins: [
    nextPlugin(), // Call the imported plugin function
    googleAI({}), // Configure Google AI provider (ensure API key is set in .env)
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
