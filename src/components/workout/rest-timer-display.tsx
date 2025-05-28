"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, Play, Pause, X, Plus } from "lucide-react"

interface RestTimerDisplayProps {
  isVisible: boolean
  formattedTime: string
  isTimerRunning: boolean // To determine Play/Pause button state
  onToggleTimer: () => void
  onStopTimer: () => void
  onAddTime: (seconds: number) => void // New prop for adding time to current timer
}

export function RestTimerDisplay({
  isVisible,
  formattedTime,
  isTimerRunning,
  onToggleTimer,
  onStopTimer,
  onAddTime,
}: RestTimerDisplayProps) {
  if (!isVisible) return null

  return (
    <Card className="sticky top-4 w-full max-w-md mx-auto shadow-lg z-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center text-lg">
          <Timer className="mr-2 h-5 w-5" /> Rest Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-5xl font-bold text-primary">{formattedTime}</div>
        
        <div className="flex justify-center space-x-3">
          <Button 
            onClick={onToggleTimer} 
            variant={isTimerRunning ? "outline" : "default"} 
            size="lg"
            className="min-w-[100px]"
          >
            {isTimerRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          <Button onClick={onStopTimer} variant="destructive" size="lg">
            <X className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Plus className="mr-1 h-3 w-3" />
            Add Time
          </div>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTime(15)}
              className="text-xs"
            >
              +15s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTime(30)}
              className="text-xs"
            >
              +30s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTime(60)}
              className="text-xs"
            >
              +1m
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 