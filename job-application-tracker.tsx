"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Mail, Plus, UserPlus, RefreshCw, Check, X, MessageSquare, MoreHorizontal, Clock } from "lucide-react" // Added Clock icon
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type JobApplication = {
  _id?: string
  id?: string
  userId: string
  companyName: string
  jobTitle: string
  jobDescription: string
  founderName: string
  founderEmail: string
  dateApplied: string
  founderLinkedIn: string
  companyLinkedIn: string
  status: "Applied" | "Interviewing" | "Offer" | "Rejected" | "Follow-up Pending" | "Awaiting Response"
  comments: string
}

const statusColors = {
  Applied: "bg-blue-100 text-blue-800",
  Interviewing: "bg-yellow-100 text-yellow-800",
  Offer: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Follow-up Pending": "bg-orange-100 text-orange-800",
  "Awaiting Response": "bg-purple-100 text-purple-800",
}

export default function JobApplicationTracker() {
  const { toast } = useToast()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [savingStates, setSavingStates] = useState<Record<string, "saving" | "saved" | "error">>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For now using a static userId - replace with actual auth when available
  const userId = "current-user-id"
  const API_BASE = "https://doord-backend.onrender.com/applications"

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0]

  // Helper to check if a date is more than a week old
  const isMoreThanAWeekOld = (dateString: string) => {
    const appliedDate = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - appliedDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 7
  }

  // Fetch all applications on component mount
  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching applications from:", API_BASE)

      const response = await fetch(API_BASE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success) {
        const mappedApplications = (data.applications || []).map((app: any) => ({
          ...app,
          id: app._id || app.id,
          dateApplied: app.dateApplied ? new Date(app.dateApplied).toISOString().split("T")[0] : getTodayDate(), // Default to today
          comments: app.comments || "",
        }))

        setApplications(mappedApplications)
      } else {
        throw new Error(data.error || "Failed to load applications")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(error.message || "Failed to load applications")
      toast({
        title: "Error",
        description: error.message || "Failed to load applications. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addNewApplication = async () => {
    setLoading("add-new", true)
    try {
      const requestBody = {
        userId,
        companyName: "New Company",
        jobTitle: "New Position",
        jobDescription: "Job description to be added",
        founderName: "Founder Name",
        founderEmail: "founder@company.com",
        founderLinkedIn: "",
        companyLinkedIn: "",
        comments: "",
        dateApplied: getTodayDate(), // Default to today's date
      }

      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        setApplications((prev) => [
          {
            ...data.application,
            id: data.application._id || data.application.id,
            dateApplied: data.application.dateApplied
              ? new Date(data.application.dateApplied).toISOString().split("T")[0]
              : getTodayDate(),
            comments: data.application.comments || "",
          },
          ...prev, // Add new application to the top
        ])
        toast({
          title: "Application added",
          description: "New application created successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to create application")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create application",
        variant: "destructive",
      })
    } finally {
      setLoading("add-new", false)
    }
  }

  // Update function with debouncing
  const updateTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  const setSavingState = (key: string, state: "saving" | "saved" | "error") => {
    setSavingStates((prev) => ({ ...prev, [key]: state }))
    if (state === "saved" || state === "error") {
      setTimeout(() => {
        setSavingStates((prev) => {
          const newState = { ...prev }
          delete newState[key]
          return newState
        })
      }, 2000)
    }
  }

  const performUpdate = async (id: string, field: keyof JobApplication, value: string) => {
    const saveKey = `${id}-${field}`
    setSavingState(saveKey, "saving")

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update ${field}: ${response.status} - ${errorText}`)
      }

      const updatedApp = await response.json()

      if (updatedApp.success) {
        setSavingState(saveKey, "saved")
      } else {
        throw new Error(updatedApp.error || `Failed to update ${field}`)
      }
    } catch (error) {
      setSavingState(saveKey, "error")
      fetchApplications()
      toast({
        title: "Update Failed",
        description: `Failed to update ${field}: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(`delete-${id}`, false)
    }
  }

  const updateApplication = useCallback((id: string, field: keyof JobApplication, value: string, immediate = false) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, [field]: value } : app)))

    const timeoutKey = `${id}-${field}`
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey])
    }

    if (immediate) {
      performUpdate(id, field, value)
    } else {
      updateTimeouts.current[timeoutKey] = setTimeout(() => {
        performUpdate(id, field, value)
        delete updateTimeouts.current[timeoutKey]
      }, 1000)
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent, id: string, field: keyof JobApplication, value: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      updateApplication(id, field, value, true)
    }
  }

  const handleBlur = (id: string, field: keyof JobApplication, value: string) => {
    const timeoutKey = `${id}-${field}`
    if (updateTimeouts.current[timeoutKey]) {
      clearTimeout(updateTimeouts.current[timeoutKey])
      delete updateTimeouts.current[timeoutKey]
    }
    performUpdate(id, field, value)
  }

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return

    setLoading(`delete-${id}`, true)
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        setApplications((prev) => prev.filter((app) => app.id !== id))
        toast({
          title: "Application deleted",
          description: data.message || "Application removed successfully",
        })
      } else {
        throw new Error("Failed to delete application")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      })
    } finally {
      setLoading(`delete-${id}`, false)
    }
  }

  const setLoading = (id: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [id]: loading }))
  }

  // Enhanced API functions
  const sendFounderEmail = async (application: JobApplication, target?: string) => {
    const loadingKey = `founder-email-${application.id}-${target || "initial"}`
    setLoading(loadingKey, true)
    try {
      console.log(`Sending founder email (${target || "initial"}) for application:`, application.id)

      const response = await fetch(`${API_BASE}/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send-email",
          target: target, // Use 'target' for context in backend
        }),
      })

      console.log("Founder email response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Founder email error:", errorText)
        throw new Error(`Failed to send email: ${response.status}`)
      }

      const data = await response.json()
      console.log("Founder email response:", data)

      if (data.success) {
        toast({
          title: "Email sent successfully",
          description: `Email sent to ${data.to || application.founderEmail}`,
        })
      } else {
        throw new Error(data.message || "Failed to send email")
      }
    } catch (error) {
      console.error("Founder email error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send founder email",
        variant: "destructive",
      })
    } finally {
      setLoading(loadingKey, false)
    }
  }

  const sendCompanyEmail = async (application: JobApplication, target?: string) => {
    const loadingKey = `company-email-${application.id}-${target || "initial"}`
    setLoading(loadingKey, true)
    try {
      // For now, we'll use the same endpoint but could be extended for company-specific emails
      toast({
        title: "Feature Coming Soon",
        description: "Company email feature will be available soon!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send company email",
        variant: "destructive",
      })
    } finally {
      setLoading(loadingKey, false)
    }
  }

  const handleLinkedInAction = async (application: JobApplication, type: "founder" | "company", target?: string) => {
    const field = type === "founder" ? "founderLinkedIn" : "companyLinkedIn"
    const loadingKey = `${type}-linkedin-${application.id}-${target || "initial"}`
    setLoading(loadingKey, true)

    try {
      console.log(`Generating ${type} LinkedIn message (${target || "initial"}) for application:`, application.id)

      const response = await fetch(`${API_BASE}/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: `${type}-linkedin`,
          target: target, // Use 'target' for context in backend
        }),
      })

      console.log(`${type} LinkedIn response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${type} LinkedIn error:`, errorText)
        throw new Error(`Failed to generate message: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`${type} LinkedIn response:", data`)

      if (data.success && data.content) {
        try {
          await navigator.clipboard.writeText(data.content)
          toast({
            title: "Message copied",
            description: data.message || `${type} LinkedIn message copied to clipboard`,
          })
        } catch (clipboardError) {
          console.error("Clipboard copy failed:", clipboardError)
          toast({
            title: "Clipboard Error",
            description: "Failed to copy message to clipboard. Please copy manually.",
            variant: "destructive",
          })
        }

        // Open LinkedIn URL AFTER clipboard copy attempt
        if (application[field]) {
          window.open(application[field], "_blank", "noopener,noreferrer")
        } else {
          toast({
            title: "No LinkedIn URL",
            description: `${type} LinkedIn URL is not provided.`,
            variant: "destructive",
          })
        }
      } else {
        throw new Error(data.message || `Failed to generate ${type} message`)
      }
    } catch (error) {
      console.error(`${type} LinkedIn error:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to generate ${type} LinkedIn message`,
        variant: "destructive",
      })
    } finally {
      setLoading(loadingKey, false)
    }
  }

  // New function to handle follow-up actions from the dropdown
  const handleFollowUpAction = async (application: JobApplication, target: string) => {
    const loadingKey = `followup-${target}-${application.id}`
    setLoading(loadingKey, true)
    try {
      console.log(`Performing follow-up action: ${target} for application:`, application.id)

      const response = await fetch(`${API_BASE}/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "follow-up", // Main action is 'follow-up'
          target: target, // Specific target for the nested switch in backend
        }),
      })

      console.log(`${target} follow-up response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${target} follow-up error:`, errorText)
        throw new Error(`Failed to perform ${target} follow-up: ${response.status}`)
      }

      const data = await response.json()
      console.log(`${target} follow-up response:`, data)

      if (data.success) {
        if (data.statusUpdated) {
          setApplications((prev) =>
            prev.map((app) => (app.id === application.id ? { ...app, status: "Follow-up Pending" } : app)),
          )
        }

        if (data.content) {
          try {
            await navigator.clipboard.writeText(data.content)
            toast({
              title: `${target} Follow-up copied`,
              description: data.message || `${target} follow-up message copied to clipboard`,
            })
          } catch (clipboardError) {
            console.error("Clipboard copy failed:", clipboardError)
            toast({
              title: "Clipboard Error",
              description: "Failed to copy message to clipboard. Please copy manually.",
              variant: "destructive",
            })
          }

          // If it's a LinkedIn action, open the URL after copying
          if (target.includes("linkedin")) {
            const linkedInUrl =
              target === "founder-linkedin" ? application.founderLinkedIn : application.companyLinkedIn
            if (linkedInUrl) {
              window.open(linkedInUrl, "_blank", "noopener,noreferrer")
            } else {
              toast({
                title: "No LinkedIn URL",
                description: `No LinkedIn URL provided for ${target.split("-")[0]}.`,
                variant: "destructive",
              })
            }
          }
        } else {
          toast({
            title: `${target} Follow-up successful`,
            description: data.message || `${target} follow-up action completed for ${application.companyName}`,
          })
        }
      } else {
        throw new Error(data.error || `Failed to perform ${target} follow-up`)
      }
    } catch (error) {
      console.error(`Error performing ${target} follow-up:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to perform ${target} follow-up`,
        variant: "destructive",
      })
    } finally {
      setLoading(loadingKey, false)
    }
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout)
      })
    }
  }, [])

  const getSaveIcon = (id: string, field: string) => {
    const saveKey = `${id}-${field}`
    const state = savingStates[saveKey]

    switch (state) {
      case "saving":
        return <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500" />
      case "saved":
        return <Check className="h-3 w-3 text-green-500" />
      case "error":
        return <X className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600">Backend Connection Error</h2>
          <p className="text-gray-600 max-w-md">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Check your browser console for detailed error logs</p>
            <Button onClick={fetchApplications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-green-600">Hello Veeeeerrrr! You are cracking this job hunt! 🚀</h1>
        <p className="text-lg text-gray-600 mt-2">Time to get that bag! 💰</p>
        <p className="text-sm text-gray-500 mt-1">
          💡 Tip: Press Enter to save immediately, or wait 1 second for auto-save
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Job Application Tracker</CardTitle>
              <CardDescription>Manage your job applications with inline editing and AI-powered actions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchApplications} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={addNewApplication}
                className="flex items-center gap-2"
                disabled={loadingStates["add-new"]}
              >
                <Plus className="h-4 w-4" />
                {loadingStates["add-new"] ? "Adding..." : "Add Application"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No applications found. Add your first application!</p>
              <Button onClick={addNewApplication} disabled={loadingStates["add-new"]}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Application
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Company</TableHead>
                    <TableHead className="min-w-[150px]">Job Title</TableHead>
                    <TableHead className="min-w-[200px]">Job Description</TableHead>
                    <TableHead className="min-w-[120px]">Founder</TableHead>
                    <TableHead className="min-w-[180px]">Founder Email</TableHead>
                    <TableHead className="min-w-[120px]">Date Applied</TableHead>
                    <TableHead className="min-w-[150px]">Founder LinkedIn</TableHead>
                    <TableHead className="min-w-[150px]">Company LinkedIn</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                    <TableHead className="min-w-[100px]">Follow Up</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">Comments</TableHead> {/* New Comments Header */}
                    <TableHead className="min-w-[80px]">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            value={app.companyName}
                            onChange={(e) => updateApplication(app.id!, "companyName", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "companyName", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "companyName", e.target.value)}
                            placeholder="Company name"
                            className="border-0 p-1 h-8"
                          />
                          {getSaveIcon(app.id!, "companyName")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            value={app.jobTitle}
                            onChange={(e) => updateApplication(app.id!, "jobTitle", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "jobTitle", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "jobTitle", e.target.value)}
                            placeholder="Job title"
                            className="border-0 p-1 h-8"
                          />
                          {getSaveIcon(app.id!, "jobTitle")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <textarea
                            value={app.jobDescription}
                            onChange={(e) => updateApplication(app.id!, "jobDescription", e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                e.preventDefault()
                                handleBlur(app.id!, "jobDescription", e.currentTarget.value)
                              }
                            }}
                            onBlur={(e) => handleBlur(app.id!, "jobDescription", e.target.value)}
                            placeholder="Job description... (Ctrl+Enter to save)"
                            className="border-0 p-1 h-16 w-full resize-none text-sm"
                            rows={2}
                          />
                          <div className="mt-1">{getSaveIcon(app.id!, "jobDescription")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            value={app.founderName}
                            onChange={(e) => updateApplication(app.id!, "founderName", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "founderName", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "founderName", e.target.value)}
                            placeholder="Founder name"
                            className="border-0 p-1 h-8"
                          />
                          {getSaveIcon(app.id!, "founderName")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="email"
                            value={app.founderEmail}
                            onChange={(e) => updateApplication(app.id!, "founderEmail", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "founderEmail", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "founderEmail", e.target.value)}
                            placeholder="founder@company.com"
                            className="border-0 p-1 h-8"
                          />
                          {getSaveIcon(app.id!, "founderEmail")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Input
                            type="date"
                            value={app.dateApplied}
                            onChange={(e) => updateApplication(app.id!, "dateApplied", e.target.value)}
                            onBlur={(e) => handleBlur(app.id!, "dateApplied", e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                          {isMoreThanAWeekOld(app.dateApplied) && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-600 text-xs px-2 py-1 flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {"1+ Week Old!"}
                            </Badge>
                          )}
                          {getSaveIcon(app.id!, "dateApplied")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="url"
                            value={app.founderLinkedIn}
                            onChange={(e) => updateApplication(app.id!, "founderLinkedIn", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "founderLinkedIn", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "founderLinkedIn", e.target.value)}
                            placeholder="LinkedIn URL"
                            className="border-0 p-1 h-8 flex-1"
                          />
                          {getSaveIcon(app.id!, "founderLinkedIn")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="url"
                            value={app.companyLinkedIn}
                            onChange={(e) => updateApplication(app.id!, "companyLinkedIn", e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, app.id!, "companyLinkedIn", e.currentTarget.value)}
                            onBlur={(e) => handleBlur(app.id!, "companyLinkedIn", e.target.value)}
                            placeholder="LinkedIn URL"
                            className="border-0 p-1 h-8 flex-1"
                          />
                          {getSaveIcon(app.id!, "companyLinkedIn")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-1">
                          {/* Founder Actions */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-600 text-center">👤 Founder</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendFounderEmail(app)}
                              disabled={loadingStates[`founder-email-${app.id}-initial`]}
                              className="h-7 px-2 text-xs w-full"
                              title="Send email to founder"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleLinkedInAction(app, "founder")}
                              disabled={loadingStates[`founder-linkedin-${app.id}-initial`] || !app.founderLinkedIn}
                              className="h-7 px-2 text-xs w-full"
                              title="Generate message & open LinkedIn"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              LinkedIn
                            </Button>
                          </div>

                          {/* Company Actions */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-600 text-center">🏢 Company</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendCompanyEmail(app)}
                              disabled={loadingStates[`company-email-${app.id}-initial`]}
                              className="h-7 px-2 text-xs w-full"
                              title="Send email to company"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleLinkedInAction(app, "company")}
                              disabled={loadingStates[`company-linkedin-${app.id}-initial`] || !app.companyLinkedIn}
                              className="h-7 px-2 text-xs w-full"
                              title="Generate message & open LinkedIn"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              LinkedIn
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 w-full flex items-center justify-center gap-1 bg-transparent"
                              title="Follow Up Actions"
                            >
                              <UserPlus className="h-3 w-3" />
                              Follow Up <MoreHorizontal className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem
                              onClick={() => handleFollowUpAction(app, "generic-message")} // Generic follow-up message
                              disabled={loadingStates[`followup-generic-message-${app.id}`]}
                            >
                              <UserPlus className="h-3 w-3 mr-2" />
                              Generate & Copy Message
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFollowUpAction(app, "founder-email")}
                              disabled={loadingStates[`followup-founder-email-${app.id}`]}
                            >
                              <Mail className="h-3 w-3 mr-2" />
                              Send Founder Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFollowUpAction(app, "company-email")}
                              disabled={loadingStates[`followup-company-email-${app.id}`]}
                            >
                              <Mail className="h-3 w-3 mr-2" />
                              Send Company Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFollowUpAction(app, "founder-linkedin")}
                              disabled={loadingStates[`followup-founder-linkedin-${app.id}`] || !app.founderLinkedIn}
                            >
                              <MessageSquare className="h-3 w-3 mr-2" />
                              Founder LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFollowUpAction(app, "company-linkedin")}
                              disabled={loadingStates[`followup-company-linkedin-${app.id}`] || !app.companyLinkedIn}
                            >
                              <MessageSquare className="h-3 w-3 mr-2" />
                              Company LinkedIn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="w-full">
                          <Select
                            value={app.status}
                            onValueChange={(value) => updateApplication(app.id!, "status", value, true)}
                          >
                            <SelectTrigger className="h-8 border-0 w-full">
                              <Badge className={`${statusColors[app.status]} text-xs px-2 py-1 truncate`}>
                                {app.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Applied">Applied</SelectItem>
                              <SelectItem value="Interviewing">Interviewing</SelectItem>
                              <SelectItem value="Offer">Offer</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                              <SelectItem value="Follow-up Pending">Follow-up Pending</SelectItem>
                              <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <textarea
                            value={app.comments}
                            onChange={(e) => updateApplication(app.id!, "comments", e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                e.preventDefault()
                                handleBlur(app.id!, "comments", e.currentTarget.value)
                              }
                            }}
                            onBlur={(e) => handleBlur(app.id!, "comments", e.target.value)}
                            placeholder="Your comments... (Ctrl+Enter to save)"
                            className="border-0 p-1 h-16 w-full resize-none text-sm"
                            rows={2}
                          />
                          <div className="mt-1">{getSaveIcon(app.id!, "comments")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteApplication(app.id!)}
                          disabled={loadingStates[`delete-${app.id}`]}
                          className="h-8 px-2"
                          title="Delete application"
                        >
                          🗑️
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
