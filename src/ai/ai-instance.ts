// src/ai/ai-instance.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next'; // Correct import using default export
import { logger } from 'genkit/logging';

logger.setLogLevel('debug');

export const ai = genkit({
  plugins: [
    googleAI(), // Keep googleAI as a function call if it requires configuration
  ],
  // enableTracingAndMetrics: true,
});
