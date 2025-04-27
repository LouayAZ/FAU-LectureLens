'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { summarizeLectureTranscript, type SummarizeLectureTranscriptOutput } from '@/ai/flows/summarize-lecture';
import { extractKeyTakeaways, type ExtractKeyTakeawaysOutput } from '@/ai/flows/extract-key-takeaways';
// Import the specific type for a single quiz question
import { generateQuiz, type GenerateQuizOutput, type QuizQuestionOutput } from '@/ai/flows/generate-quiz';
import { Upload, FileText, Zap, HelpCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

// Extend the imported QuizQuestionOutput type
interface QuizQuestion extends QuizQuestionOutput {
  userAnswer?: string;
  isCorrect?: boolean;
}


export default function LectureLens() {
  const [transcript, setTranscript] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [summary, setSummary] = useState<SummarizeLectureTranscriptOutput | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState<ExtractKeyTakeawaysOutput | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    takeaways: false,
    quiz: false,
  });
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTranscript(text);
        setFileName(file.name);
        // Reset generated content when new file is uploaded
        setSummary(null);
        setKeyTakeaways(null);
        setQuiz(null);
        setQuizSubmitted(false);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .txt file.",
        variant: "destructive",
      });
      setTranscript('');
      setFileName('');
    }
  };

  const handleGenerate = async (type: 'summary' | 'takeaways' | 'quiz') => {
    if (!transcript) {
       toast({
        title: "No Transcript",
        description: "Please upload a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setQuizSubmitted(false); // Reset quiz submission state if generating again

    try {
      if (type === 'summary') {
        const result = await summarizeLectureTranscript({ transcript });
        setSummary(result);
      } else if (type === 'takeaways') {
        const result = await extractKeyTakeaways({ transcript });
        setKeyTakeaways(result);
      } else if (type === 'quiz') {
        const result = await generateQuiz({ transcript, numQuestions: 5 });
         // Initialize quiz state with user answer tracking
        const initialQuizState = result.questions.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined }));
        setQuiz(initialQuizState);
      }
       toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Generated`,
        description: `Successfully generated the ${type}.`,
      });
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
       toast({
        title: `Error Generating ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Failed to generate the ${type}. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      if (type === 'summary') setSummary(null);
      if (type === 'takeaways') setKeyTakeaways(null);
      if (type === 'quiz') setQuiz(null); // Clear quiz on error
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

 const handleQuizAnswerChange = (questionIndex: number, answer: string) => {
    setQuiz(prevQuiz => {
      if (!prevQuiz) return null;
      const updatedQuiz = [...prevQuiz];
      updatedQuiz[questionIndex] = {
        ...updatedQuiz[questionIndex],
        userAnswer: answer,
      };
      return updatedQuiz;
    });
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;

    // Check if all questions are answered
    const allAnswered = quiz.every(q => q.userAnswer !== undefined);
    if (!allAnswered) {
       toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }


    const updatedQuiz = quiz.map(q => ({
      ...q,
      isCorrect: q.userAnswer === q.correctAnswer,
    }));
    setQuiz(updatedQuiz);
    setQuizSubmitted(true);

    // Calculate score
    const correctCount = updatedQuiz.filter(q => q.isCorrect).length;
    const totalQuestions = updatedQuiz.length;
     toast({
        title: "Quiz Submitted!",
        description: `You scored ${correctCount} out of ${totalQuestions}.`,
      });
  };

  const getResultColor = (question: QuizQuestion) => {
    if (!quizSubmitted || question.userAnswer === undefined) return '';
    return question.isCorrect ? 'text-green-600' : 'text-red-600';
  };


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">LectureLens</h1>
        <p className="text-lg text-muted-foreground">
          Upload your lecture transcript and unlock summaries, key takeaways, and quizzes.
        </p>
        <p className="text-lg text-muted-foreground">   (FAU Students: laboalzahab2021, culus2021) </p>
      </header>

      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" /> Upload Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="transcript-upload">Upload .txt file</Label>
            <Input id="transcript-upload" type="file" accept=".txt" onChange={handleFileChange} className="file:text-foreground"/>
             {fileName && <p className="text-sm text-muted-foreground mt-2">Uploaded: {fileName}</p>}
          </div>
          <Textarea
            placeholder="Or paste your transcript here..."
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setFileName(''); // Clear file name if pasting
              // Reset generated content when pasting new text
              setSummary(null);
              setKeyTakeaways(null);
              setQuiz(null);
              setQuizSubmitted(false);
            }}
            className="mt-4 min-h-[150px] bg-background"
            aria-label="Lecture Transcript Input"
          />
        </CardContent>
      </Card>

      {transcript && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted">
            <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" /> Summary
            </TabsTrigger>
            <TabsTrigger value="takeaways" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
               <Zap className="h-4 w-4 mr-2" /> Key Takeaways
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <HelpCircle className="h-4 w-4 mr-2" /> Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-primary">
                   Summary
                  <Button onClick={() => handleGenerate('summary')} disabled={loadingStates.summary || !transcript} variant="outline" size="sm">
                    {loadingStates.summary ? 'Generating...' : 'Generate Summary'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStates.summary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : summary ? (
                  <p className="whitespace-pre-wrap">{summary.summary}</p>
                ) : (
                  <p className="text-muted-foreground">Click 'Generate Summary' to create a summary.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="takeaways">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-primary">
                  Key Takeaways
                  <Button onClick={() => handleGenerate('takeaways')} disabled={loadingStates.takeaways || !transcript} variant="outline" size="sm">
                     {loadingStates.takeaways ? 'Extracting...' : 'Extract Takeaways'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStates.takeaways ? (
                   <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                   </div>
                ) : keyTakeaways ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {keyTakeaways.keyTakeaways.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-muted-foreground">Click 'Extract Takeaways' to identify key points.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-primary">
                  Quiz Yourself
                  <Button onClick={() => handleGenerate('quiz')} disabled={loadingStates.quiz || !transcript} variant="outline" size="sm">
                    {loadingStates.quiz ? 'Generating...' : 'Generate Quiz'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStates.quiz ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : quiz ? (
                  <div className="space-y-6">
                    {quiz.map((q, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <p className="font-semibold mb-2">{index + 1}. {q.question}</p>
                         <RadioGroup
                          onValueChange={(value) => handleQuizAnswerChange(index, value)}
                          value={q.userAnswer}
                          disabled={quizSubmitted}
                          className="space-y-1"
                        >
                          {q.options.map((option, optionIndex) => (
                            <div key={optionIndex} className={`flex items-center space-x-2 ${quizSubmitted ? getResultColor(q) : ''}`}>
                               <RadioGroupItem
                                value={option}
                                id={`q${index}-option${optionIndex}`}
                                className={`${quizSubmitted && q.userAnswer === option ? (q.isCorrect ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600') : ''} ${quizSubmitted && q.correctAnswer === option && 'border-green-600'}`}
                              />
                              <Label
                                htmlFor={`q${index}-option${optionIndex}`}
                                className={`cursor-pointer ${quizSubmitted && q.userAnswer === option ? (q.isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium') : ''} ${quizSubmitted && q.correctAnswer === option ? 'text-green-700 font-medium' : ''}`}
                              >
                                {option}
                                {quizSubmitted && q.userAnswer === option && !q.isCorrect && ' (Your Answer)'}
                                {quizSubmitted && q.correctAnswer === option && ' (Correct Answer)'}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                         {quizSubmitted && !q.isCorrect && q.userAnswer !== undefined && (
                            <p className="text-sm text-red-600 mt-1">Incorrect. The correct answer was: {q.correctAnswer}</p>
                         )}
                         {quizSubmitted && q.isCorrect && (
                            <p className="text-sm text-green-600 mt-1">Correct!</p>
                         )}
                      </div>
                    ))}
                     <Button
                        onClick={handleSubmitQuiz}
                        disabled={quizSubmitted || quiz.some(q => q.userAnswer === undefined)}
                        className="mt-6 w-full"
                        variant="default"
                      >
                        {quizSubmitted ? 'Quiz Submitted' : 'Submit Quiz'}
                      </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Click 'Generate Quiz' to test your knowledge.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
