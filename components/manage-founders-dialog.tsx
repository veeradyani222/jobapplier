"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Founder {
  name: string
  email: string
  linkedIn: string
}

interface ManageFoundersDialogProps {
  isOpen: boolean
  onClose: () => void
  initialFounders: Founder[]
  onSave: (updatedFounders: Founder[]) => void
}

export function ManageFoundersDialog({ isOpen, onClose, initialFounders, onSave }: ManageFoundersDialogProps) {
  const [founders, setFounders] = useState<Founder[]>(initialFounders)
  const { toast } = useToast()

  useEffect(() => {
    setFounders(initialFounders)
  }, [initialFounders])

  const handleAddFounder = () => {
    setFounders([...founders, { name: "", email: "", linkedIn: "" }])
  }

  const handleRemoveFounder = (index: number) => {
    setFounders(founders.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: keyof Founder, value: string) => {
    const newFounders = [...founders]
    newFounders[index] = { ...newFounders[index], [field]: value }
    setFounders(newFounders)
  }

  const handleSave = () => {
    // Basic validation
    const isValid = founders.every((f) => f.name.trim() !== "" && f.email.trim() !== "" && f.linkedIn.trim() !== "")
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields for each founder.",
        variant: "destructive",
      })
      return
    }
    onSave(founders)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Founders</DialogTitle>
          <DialogDescription>Add, edit, or remove founder details for this application.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {founders.length === 0 && (
            <p className="text-center text-gray-500">No founders added yet. Click "Add Founder" to begin.</p>
          )}
          {founders.map((founder, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 items-end gap-2 border-b pb-4 last:border-b-0">
              <div className="space-y-1">
                <Label htmlFor={`name-${index}`}>Name</Label>
                <Input
                  id={`name-${index}`}
                  value={founder.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  placeholder="Founder Name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`email-${index}`}>Email</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={founder.email}
                  onChange={(e) => handleChange(index, "email", e.target.value)}
                  placeholder="founder@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`linkedin-${index}`}>LinkedIn URL</Label>
                <Input
                  id={`linkedin-${index}`}
                  type="url"
                  value={founder.linkedIn}
                  onChange={(e) => handleChange(index, "linkedIn", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveFounder(index)}
                className="mt-auto"
                title="Remove Founder"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddFounder} className="mt-4 bg-transparent">
            <Plus className="mr-2 h-4 w-4" /> Add Founder
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
