"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderPlusIcon, RocketIcon } from "lucide-react"

interface EmptyProjectsStateProps {
  onCreateProject: () => void
}

export function EmptyProjectsState({ onCreateProject }: EmptyProjectsStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-center p-12 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
            <div className="relative bg-primary/10 p-6 rounded-full">
              <FolderPlusIcon className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">
              No projects yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Get started by creating your first project. Track tasks, manage terminals, and streamline your development workflow with Claude Code.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              onClick={onCreateProject}
              className="w-full gap-2"
            >
              <RocketIcon className="h-4 w-4" />
              Create Your First Project
            </Button>

            <p className="text-xs text-muted-foreground">
              Projects help you organize tasks, terminals, and team members in one place
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
