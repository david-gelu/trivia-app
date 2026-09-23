import React, { useEffect, useState } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'

import QuestionCard from './components/QuestionCard'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import questions from './data/questions.json'

const uniqueQuestions = [...new Map(
  questions.map((question) => [question.text, question]),
).values()]

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5)

const randomizeChoices = (question) => ({
  ...question,
  choices: shuffle(question.choices.map((choice) => ({ ...choice }))),
})

const buildQuestionDeck = (items) => shuffle(items.map((question) => randomizeChoices(question)))

export default function App() {
  const [remainingQuestions, setRemainingQuestions] = useState(() => buildQuestionDeck(uniqueQuestions))
  const [score, setScore] = useState(() => {
    const stored = localStorage.getItem('trivia-score')
    return stored ? Number(stored) : 0
  })
  const [isAnswered, setIsAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswer, setCorrectAnswer] = useState(null)

  useEffect(() => {
    localStorage.setItem('trivia-score', String(score))
  }, [score])

  const currentQuestion = remainingQuestions[0]
  const totalQuestions = uniqueQuestions.length

  const moveToNextQuestion = () => {
    setRemainingQuestions((prev) => {
      const nextPool = prev.slice(1)

      if (nextPool.length === 0) {
        return buildQuestionDeck(uniqueQuestions)
      }

      return shuffle(nextPool.map((question) => randomizeChoices(question)))
    })
    setIsAnswered(false)
    setSelectedAnswer(null)
    setCorrectAnswer(null)
  }

  const handleAnswer = (choiceIndex, isCorrect) => {
    if (isAnswered) return

    const correctIndex = currentQuestion.choices.findIndex((choice) => choice.isCorrect)
    setSelectedAnswer(choiceIndex)
    setCorrectAnswer(correctIndex)
    setIsAnswered(true)

    if (isCorrect) {
      setScore((s) => s + 1)
    }

    window.setTimeout(() => {
      moveToNextQuestion()
    }, 3000)
  }

  const handleSkip = () => {
    if (isAnswered) return
    moveToNextQuestion()
  }

  const handleReset = () => {
    setRemainingQuestions(buildQuestionDeck(uniqueQuestions))
    setScore(0)
    setIsAnswered(false)
    setSelectedAnswer(null)
    setCorrectAnswer(null)
    localStorage.removeItem('trivia-score')
  }

  const finished = remainingQuestions.length === 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-4 sm:p-6">
        <div className="w-full">
          <header className="mb-6 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Trivia challenge
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Daily Quiz</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
              <Trophy className="h-4 w-4 text-primary" />
              Score: {score} / {totalQuestions}
            </div>
          </header>

          {finished ? (
            <Card className="mx-auto max-w-xl border-border/80 bg-card shadow-card">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Quiz finished!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-lg text-muted-foreground">
                  Final score: <span className="font-semibold text-foreground">{score} / {totalQuestions}</span>
                </p>
                <Button onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restart quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <QuestionCard
              question={currentQuestion}
              currentIndex={totalQuestions - remainingQuestions.length}
              total={totalQuestions}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              isAnswered={isAnswered}
              selectedAnswer={selectedAnswer}
              correctAnswer={correctAnswer}
            />
          )}
        </div>
      </div>
    </div>
  )
}
