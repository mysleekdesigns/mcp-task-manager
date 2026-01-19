"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronRightIcon, SettingsIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type {
  PhaseConfig,
  ProfileId,
  ModelName,
  ThinkingLevel,
} from "@/types/agent-profiles"
import {
  getModelLabel,
  getThinkingLevelLabel,
} from "@/lib/agent-profiles"

interface PhaseConfigPanelProps {
  phaseConfig: PhaseConfig
  onChange: (config: PhaseConfig) => void
  disabled?: boolean
  profileId: ProfileId
}

const MODELS: ModelName[] = ["opus-4-5", "sonnet-4-5", "haiku-4-5"]
const THINKING_LEVELS: ThinkingLevel[] = ["low", "medium", "high", "ultrathink"]

const PHASE_LABELS = {
  specCreation: "Spec Creation",
  planning: "Planning",
  coding: "Coding",
  qaReview: "QA Review",
} as const

export function PhaseConfigPanel({
  phaseConfig,
  onChange,
  disabled = false,
  profileId,
}: PhaseConfigPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const isCustomProfile = profileId === "custom"
  const isDisabled = disabled || !isCustomProfile

  const handlePhaseChange = (
    phase: keyof PhaseConfig,
    field: "model" | "thinkingLevel",
    value: string
  ) => {
    if (isDisabled) return

    onChange({
      ...phaseConfig,
      [phase]: {
        ...phaseConfig[phase],
        [field]: value,
      },
    })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/50",
              isOpen && "bg-muted/50",
              isDisabled && "cursor-not-allowed opacity-60"
            )}
            disabled={isDisabled}
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {isCustomProfile
                  ? "Per-Phase Configuration"
                  : "Phase Configuration (View Only)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isCustomProfile && (
                <span className="text-xs text-muted-foreground">
                  Click to customize
                </span>
              )}
              {isOpen ? (
                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground px-1">
            {isCustomProfile
              ? "Configure model and thinking level for each phase independently."
              : "This profile uses the same configuration across all phases. Switch to Custom profile to modify per-phase settings."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(PHASE_LABELS) as Array<keyof PhaseConfig>).map(
              (phase) => (
                <div
                  key={phase}
                  className={cn(
                    "rounded-lg border border-border bg-card p-4 space-y-3",
                    isDisabled && "opacity-60"
                  )}
                >
                  <h4 className="text-sm font-semibold text-foreground">
                    {PHASE_LABELS[phase]}
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor={`${phase}-model`} className="text-xs">
                      Model
                    </Label>
                    <Select
                      value={phaseConfig[phase].model}
                      onValueChange={(value) =>
                        handlePhaseChange(phase, "model", value)
                      }
                      disabled={isDisabled}
                    >
                      <SelectTrigger
                        id={`${phase}-model`}
                        className="w-full"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {getModelLabel(model)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`${phase}-thinking`}
                      className="text-xs"
                    >
                      Thinking Level
                    </Label>
                    <Select
                      value={phaseConfig[phase].thinkingLevel}
                      onValueChange={(value) =>
                        handlePhaseChange(phase, "thinkingLevel", value)
                      }
                      disabled={isDisabled}
                    >
                      <SelectTrigger
                        id={`${phase}-thinking`}
                        className="w-full"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THINKING_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {getThinkingLevelLabel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
