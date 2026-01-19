"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AGENT_PROFILES } from "@/lib/agent-profiles"
import type { ProfileId } from "@/types/agent-profiles"
import {
  Sparkles,
  Brain,
  Scale,
  Zap,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentProfileSelectProps {
  value: ProfileId
  onChange: (profileId: ProfileId) => void
  disabled?: boolean
}

// Map icon names to Lucide icon components
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Brain,
  Scale,
  Zap,
  Settings,
}

// Get the icon component for a profile
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Sparkles
}

export function AgentProfileSelect({
  value,
  onChange,
  disabled = false,
}: AgentProfileSelectProps) {
  const selectedProfile = AGENT_PROFILES[value]
  const SelectedIcon = getIconComponent(selectedProfile.icon)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <SelectedIcon className="size-4 text-cyan-500" />
            <span>{selectedProfile.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(AGENT_PROFILES) as ProfileId[]).map((profileId) => {
          const profile = AGENT_PROFILES[profileId]
          const Icon = getIconComponent(profile.icon)
          const isSelected = value === profileId

          return (
            <SelectItem
              key={profileId}
              value={profileId}
              className={cn(
                "cursor-pointer",
                isSelected && "bg-cyan-500/10 text-cyan-500"
              )}
            >
              <div className="flex items-start gap-3 py-1">
                <Icon
                  className={cn(
                    "size-4 mt-0.5 shrink-0",
                    isSelected ? "text-cyan-500" : "text-muted-foreground"
                  )}
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isSelected && "text-cyan-500"
                    )}
                  >
                    {profile.name}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {profile.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
