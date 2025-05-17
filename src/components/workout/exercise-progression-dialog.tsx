"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"

interface ExerciseProgressionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName?: string
  shouldProgress: boolean
  onShouldProgressChange: (checked: boolean) => void
  progressionAmount: number
  onProgressionAmountChange: (value: number) => void
  onConfirm: () => void
  onSkip: () => void
  isSaving: boolean
}

export function ExerciseProgressionDialog({
  open,
  onOpenChange,
  exerciseName,
  shouldProgress,
  onShouldProgressChange,
  progressionAmount,
  onProgressionAmountChange,
  onConfirm,
  onSkip,
  isSaving,
}: ExerciseProgressionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Progression for {exerciseName || "Exercise"}</DialogTitle>
          <DialogDescription>
            Did you successfully complete all sets for this exercise? If so, consider increasing the weight for next time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="shouldProgress"
              checked={shouldProgress}
              onCheckedChange={onShouldProgressChange}
            />
            <Label htmlFor="shouldProgress">Increment weight for next session?</Label>
          </div>
          {shouldProgress && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="progressionAmount" className="w-32">Increment (kg):</Label>
              <Input 
                id="progressionAmount" 
                type="number" 
                step="0.1"
                value={progressionAmount} 
                onChange={(e) => onProgressionAmountChange(parseFloat(e.target.value))} 
                className="w-24 text-center"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onSkip} disabled={isSaving}>Skip</Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Progression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 