"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  MessageSquareIcon,
  PlayIcon,
  CheckCircleIcon,
} from "lucide-react"

type LogType =
  | "phase_start"
  | "file_read"
  | "file_write"
  | "ai_response"
  | "command"
  | "error"

interface LogEntry {
  id: string
  type: LogType
  message: string
  output?: string
  timestamp: Date
}

interface PhaseLog {
  name: string
  status: "pending" | "in_progress" | "completed" | "failed"
  model?: string
  logs: LogEntry[]
}

interface LogsTabProps {
  phaseLogs: PhaseLog[]
}

export function LogsTab({ phaseLogs }: LogsTabProps) {
  const [expandedPhases, setExpandedPhases] = React.useState<Set<string>>(
    new Set(["Planning"])
  )
  const [expandedOutputs, setExpandedOutputs] = React.useState<Set<string>>(
    new Set()
  )

  const togglePhase = (phaseName: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseName)) {
        next.delete(phaseName)
      } else {
        next.add(phaseName)
      }
      return next
    })
  }

  const toggleOutput = (logId: string) => {
    setExpandedOutputs((prev) => {
      const next = new Set(prev)
      if (next.has(logId)) {
        next.delete(logId)
      } else {
        next.add(logId)
      }
      return next
    })
  }

  const getStatusBadge = (status: PhaseLog["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case "phase_start":
        return <PlayIcon className="size-4 text-primary" />
      case "file_read":
      case "file_write":
        return <FileIcon className="size-4 text-blue-500" />
      case "ai_response":
        return <MessageSquareIcon className="size-4 text-purple-500" />
      case "command":
        return <PlayIcon className="size-4 text-green-500" />
      case "error":
        return <CheckCircleIcon className="size-4 text-destructive" />
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date)
  }

  if (phaseLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No logs available yet. Logs will appear when task processing starts.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {phaseLogs.map((phase) => (
        <div
          key={phase.name}
          className="border rounded-md overflow-hidden bg-card"
        >
          <button
            type="button"
            onClick={() => togglePhase(phase.name)}
            className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
          >
            {expandedPhases.has(phase.name) ? (
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            )}

            <span className="font-medium text-sm">{phase.name}</span>

            <div className="flex items-center gap-2 ml-auto">
              {phase.model && (
                <Badge variant="outline" className="text-xs">
                  {phase.model}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {phase.logs.length} entries
              </Badge>
              {getStatusBadge(phase.status)}
            </div>
          </button>

          {expandedPhases.has(phase.name) && (
            <div className="border-t">
              {phase.logs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No log entries for this phase
                </div>
              ) : (
                <div className="divide-y">
                  {phase.logs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-accent/30">
                      <div className="flex items-start gap-2">
                        {getLogIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-foreground">
                              {log.message}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>

                          {log.output && (
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOutput(log.id)}
                                className="h-auto py-1 px-2 text-xs"
                              >
                                {expandedOutputs.has(log.id) ? (
                                  <>
                                    <ChevronDownIcon className="size-3 mr-1" />
                                    Hide output
                                  </>
                                ) : (
                                  <>
                                    <ChevronRightIcon className="size-3 mr-1" />
                                    Show output
                                  </>
                                )}
                              </Button>

                              {expandedOutputs.has(log.id) && (
                                <pre className="mt-2 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                  <code>{log.output}</code>
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
