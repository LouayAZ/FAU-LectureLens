// src/ai/ai-instance.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next'; // Correct import using default export

export const ai = genkit({
  plugins: [
    nextPlugin, // Pass the plugin object directly
    googleAI(), // Keep googleAI as a function call if it requires configuration
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
