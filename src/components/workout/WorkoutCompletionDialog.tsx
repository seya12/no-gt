"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2, Loader2 } from "lucide-react"

interface WorkoutCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  isCompleting: boolean
}

export function WorkoutCompletionDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isCompleting,
}: WorkoutCompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Workout?</DialogTitle>
          <DialogDescription>
            You&apos;ve completed all sets. Ready to finish this workout session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isCompleting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isCompleting}>
            {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Yes, Complete Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 