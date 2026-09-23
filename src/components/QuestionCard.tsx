import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipForward } from 'lucide-react'

import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import ThemeColor from '../ThemeColor'

export default function QuestionCard({
  question,
  currentIndex,
  total,
  onAnswer,
  onSkip,
  isAnswered,
  selectedAnswer,
  correctAnswer,
}) {
  if (!question) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id || question.text}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden border-border/80 bg-card shadow-card">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Question {currentIndex + 1}/{total}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onSkip}
                disabled={isAnswered}
              >
                Skip
                <SkipForward className="h-4 w-4" />
              </Button>
              <ThemeColor />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {question.category}
              </span>
              <span className="text-xs text-muted-foreground">{question.difficulty}</span>
            </div>
            <CardTitle className="text-2xl leading-relaxed text-foreground">{question.text}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {question.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === idx
              const isCorrect = correctAnswer === idx
              const showCorrect = isAnswered && isCorrect
              const showIncorrect = isAnswered && isSelected && !choice.isCorrect

              return (
                <motion.button
                  key={`${choice.text}-${idx}`}
                  type="button"
                  whileHover={isAnswered ? undefined : { scale: 1.01 }}
                  whileTap={isAnswered ? undefined : { scale: 0.99 }}
                  onClick={() => onAnswer(idx, choice.isCorrect)}
                  disabled={isAnswered}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    isAnswered && showCorrect ? 'border-green-500 bg-green-500/10' : '',
                    isAnswered && showIncorrect ? 'border-red-500 bg-red-500/10' : '',
                    !isAnswered ? 'border-border bg-background hover:border-primary/60 hover:bg-accent/40' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                      showCorrect ? 'bg-green-600 text-white' : '',
                      showIncorrect ? 'bg-red-600 text-white' : '',
                      !showCorrect && !showIncorrect ? 'bg-primary/10 text-primary' : '',
                    ].join(' ')}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base text-foreground">{choice.text}</span>
                </motion.button>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
