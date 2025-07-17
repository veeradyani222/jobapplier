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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FounderMessage {
  name: string
  message: string
  linkedIn: string | null
}

interface MultiFounderLinkedInDialogProps {
  isOpen: boolean
  onClose: () => void
  founderMessages: FounderMessage[]
}

export function MultiFounderLinkedInDialog({ isOpen, onClose, founderMessages }: MultiFounderLinkedInDialogProps) {
  const { toast } = useToast()

  const handleCopy = async (message: string, name: string) => {
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: "Message Copied!",
        description: `LinkedIn message for ${name} copied to clipboard.`,
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

  const handleOpenLinkedIn = (linkedInUrl: string | null, name: string) => {
    if (linkedInUrl) {
      window.open(linkedInUrl, "_blank", "noopener,noreferrer")
    } else {
      toast({
        title: "No LinkedIn URL",
        description: `No LinkedIn URL provided for ${name}.`,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Generated LinkedIn Messages</DialogTitle>
          <DialogDescription>
            Here are the messages generated for each founder. Copy and open LinkedIn for each.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {founderMessages.length === 0 && <p className="text-center text-gray-500">No messages generated.</p>}
          {founderMessages.map((fm, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{fm.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={fm.message} readOnly rows={6} className="min-h-[100px] resize-y font-mono text-sm" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => handleCopy(fm.message, fm.name)} className="w-full sm:w-auto">
                    <Copy className="mr-2 h-4 w-4" /> Copy Message
                  </Button>
                  <Button
                    onClick={() => handleOpenLinkedIn(fm.linkedIn, fm.name)}
                    disabled={!fm.linkedIn}
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
