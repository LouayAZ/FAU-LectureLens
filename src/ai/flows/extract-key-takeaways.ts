'use server';
/**
 * @fileOverview Extracts key takeaways from a lecture transcript.
 *
 * - extractKeyTakeaways - A function that extracts key takeaways from a lecture transcript.
 * - ExtractKeyTakeawaysInput - The input type for the extractKeyTakeaways function.
 * - ExtractKeyTakeawaysOutput - The return type for the extractKeyTakeaways function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractKeyTakeawaysInputSchema = z.object({
  transcript: z.string().describe('The lecture transcript.'),
});
export type ExtractKeyTakeawaysInput = z.infer<typeof ExtractKeyTakeawaysInputSchema>;

const ExtractKeyTakeawaysOutputSchema = z.object({
  keyTakeaways: z.array(z.string()).describe('The key takeaways from the lecture.'),
});
export type ExtractKeyTakeawaysOutput = z.infer<typeof ExtractKeyTakeawaysOutputSchema>;

export async function extractKeyTakeaways(input: ExtractKeyTakeawaysInput): Promise<ExtractKeyTakeawaysOutput> {
  return extractKeyTakeawaysFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyTakeawaysPrompt',
  input: {
    schema: z.object({
      transcript: z.string().describe('The lecture transcript.'),
    }),
  },
  output: {
    schema: z.object({
      keyTakeaways: z.array(z.string()).describe('The key takeaways from the lecture.'),
    }),
  },
  prompt: `You are an AI assistant designed to extract key takeaways from lecture transcripts.

  Please provide a list of the most important points from the following transcript:
  {{transcript}}

  Format your response as a list of key takeaways.
  `,
});

const extractKeyTakeawaysFlow = ai.defineFlow<
  typeof ExtractKeyTakeawaysInputSchema,
  typeof ExtractKeyTakeawaysOutputSchema
>(
  {
    name: 'extractKeyTakeawaysFlow',
    inputSchema: ExtractKeyTakeawaysInputSchema,
    outputSchema: ExtractKeyTakeawaysOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
