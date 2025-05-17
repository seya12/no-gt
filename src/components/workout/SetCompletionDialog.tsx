"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"

interface SetCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tempReps: number | null
  tempWeight: number | null
  onConfirm: () => void
  onCancel: () => void
  adjustTempReps: (amount: number) => void
  adjustTempWeight: (amount: number) => void
  onTempRepsInputChange?: (value: number | null) => void
  onTempWeightInputChange?: (value: number | null) => void
}

export function SetCompletionDialog({
  open,
  onOpenChange,
  tempReps,
  tempWeight,
  onConfirm,
  onCancel,
  adjustTempReps,
  adjustTempWeight,
  onTempRepsInputChange,
  onTempWeightInputChange,
}: SetCompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Set</DialogTitle>
          <DialogDescription>
            Adjust reps and weight if needed, then confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="reps" className="w-16">Reps:</Label>
            <Button variant="outline" size="icon" onClick={() => adjustTempReps(-1)}><Minus className="h-4 w-4" /></Button>
            <Input 
              id="reps" 
              type="number" 
              value={tempReps ?? ""} 
              onChange={(e) => {
                if (onTempRepsInputChange) {
                  const numValue = parseInt(e.target.value)
                  onTempRepsInputChange(isNaN(numValue) ? null : numValue)
                }
              }} 
              className="w-20 text-center" 
            />
            <Button variant="outline" size="icon" onClick={() => adjustTempReps(1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="weight" className="w-16">Weight (kg):</Label>
            <Button variant="outline" size="icon" onClick={() => adjustTempWeight(-0.5)}><Minus className="h-4 w-4" /></Button>
            <Input 
              id="weight" 
              type="number" 
              step="0.1" 
              value={tempWeight ?? ""} 
              onChange={(e) => {
                if (onTempWeightInputChange) {
                  const numValue = parseFloat(e.target.value)
                  onTempWeightInputChange(isNaN(numValue) ? null : numValue)
                }
              }} 
              className="w-20 text-center" 
            />
            <Button variant="outline" size="icon" onClick={() => adjustTempWeight(0.5)}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 