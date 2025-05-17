"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Timer, Play, Pause, X } from "lucide-react"

interface RestTimerDisplayProps {
  isVisible: boolean
  formattedTime: string
  isTimerRunning: boolean // To determine Play/Pause button state
  onToggleTimer: () => void
  onStopTimer: () => void
  tempRestDurationMinutes: number
  tempRestDurationSeconds: number
  onRestDurationMinutesChange: (minutes: number) => void
  onRestDurationSecondsChange: (seconds: number) => void
}

export function RestTimerDisplay({
  isVisible,
  formattedTime,
  isTimerRunning,
  onToggleTimer,
  onStopTimer,
  tempRestDurationMinutes,
  tempRestDurationSeconds,
  onRestDurationMinutesChange,
  onRestDurationSecondsChange,
}: RestTimerDisplayProps) {
  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-72 shadow-lg z-50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Timer className="mr-2" /> Rest Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-4xl font-bold mb-2">{formattedTime}</p>
        <div className="flex justify-center space-x-2">
          <Button onClick={onToggleTimer} variant={isTimerRunning ? "outline" : "default"} size="sm">
            {isTimerRunning ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
            {isTimerRunning ? "Pause" : "Resume"}
          </Button>
          <Button onClick={onStopTimer} variant="destructive" size="sm">
            <X className="mr-1 h-4 w-4" /> Stop
          </Button>
        </div>
        <Input 
          type="number" 
          value={tempRestDurationMinutes}
          onChange={(e) => onRestDurationMinutesChange(parseInt(e.target.value))}
          className="w-20 mt-2 inline-block mx-1" 
          placeholder="Mins"
          min="0"
        />
        <Input 
          type="number" 
          value={tempRestDurationSeconds}
          onChange={(e) => onRestDurationSecondsChange(parseInt(e.target.value))}
          className="w-20 mt-2 inline-block mx-1" 
          placeholder="Secs"
          min="0"
          max="59"
        />
      </CardContent>
    </Card>
  )
} 