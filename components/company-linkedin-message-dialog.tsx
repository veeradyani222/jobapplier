"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink } from "lucide-react"

interface CompanyLinkedInMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  message: string
  linkedInUrl: string
  type: "company" // Explicitly set to 'company'
}

export function CompanyLinkedInMessageDialog({
  isOpen,
  onClose,
  message,
  linkedInUrl,
  type,
}: CompanyLinkedInMessageDialogProps) {
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: "Message Copied!",
        description: "The AI-generated message has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy message:", error)
      toast({
        title: "Copy Failed",
        description: "Could not copy message to clipboard. Please copy manually.",
        variant: "destructive",
      })
    }
  }

  const handleOpenLinkedIn = () => {
    if (linkedInUrl) {
      window.open(linkedInUrl, "_blank", "noopener,noreferrer")
      onClose() // Close dialog after opening LinkedIn
    } else {
      toast({
        title: "No LinkedIn URL",
        description: `No LinkedIn URL provided for the ${type}.`,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI-Generated LinkedIn Message</DialogTitle>
          <DialogDescription>
            Here's the message generated for the {type}. Copy it and then open LinkedIn.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea value={message} readOnly rows={10} className="min-h-[150px] resize-y font-mono text-sm" />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button onClick={handleCopy} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" /> Copy Message
          </Button>
          <Button onClick={handleOpenLinkedIn} disabled={!linkedInUrl} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" /> Open {type === "founder" ? "Founder" : "Company"} LinkedIn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
