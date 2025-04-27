'use server';

/**
 * @fileOverview Generates multiple-choice quiz questions from a lecture transcript.
 *
 * - generateQuiz - A function that generates quiz questions from a transcript.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 * - QuizQuestionOutput - The type for a single generated quiz question.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  transcript: z
    .string()
    .describe('The lecture transcript to generate quiz questions from.'),
  numQuestions: z
    .number()
    .default(5)
    .describe('The number of quiz questions to generate.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Define schema for a single question
const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The multiple-choice options.'),
  correctAnswer: z.string().describe('The correct answer.'),
});
// Export the type for a single question
export type QuizQuestionOutput = z.infer<typeof QuizQuestionSchema>;


const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated quiz questions.')
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  model: 'googleai/gemini-1.5-flash', // Specify the model by string identifier
  input: {
    schema: z.object({
      transcript: z
        .string()
        .describe('The lecture transcript to generate quiz questions from.'),
      numQuestions: z
        .number()
        .default(5)
        .describe('The number of quiz questions to generate.'),
    }),
  },
  output: {
    // Use the existing GenerateQuizOutputSchema which now internally uses QuizQuestionSchema
    schema: GenerateQuizOutputSchema,
  },
  prompt: `You are an expert educator creating a multiple choice quiz based on the following lecture transcript.  Create {{{numQuestions}}} multiple choice questions.

Transcript: {{{transcript}}}

Each question should have 4 possible answers, with one being the correct answer.

Output a JSON object matching the output schema.
`,
});

const generateQuizFlow = ai.defineFlow<
  typeof GenerateQuizInputSchema,
  typeof GenerateQuizOutputSchema
>(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure output matches the schema, especially the array structure
    if (!output || !Array.isArray(output.questions)) {
        throw new Error("Invalid output format received from AI model.");
    }
    return output;
  }
);

