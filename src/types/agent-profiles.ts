/**
 * Agent Profile System Types
 *
 * Defines types for configuring AI model behavior across task phases.
 */

/**
 * Thinking level determines how much reasoning the model performs.
 * - low: Fast, straightforward responses
 * - medium: Moderate reasoning
 * - high: Extended thinking for complex problems
 * - ultrathink: Maximum reasoning capacity
 */
export type ThinkingLevel = 'low' | 'medium' | 'high' | 'ultrathink';

/**
 * Available Claude models.
 */
export type ModelName = 'opus-4-5' | 'sonnet-4-5' | 'haiku-4-5';

/**
 * Profile identifier for preset configurations.
 */
export type ProfileId = 'auto' | 'complex' | 'balanced' | 'quick' | 'custom';

/**
 * Complete agent profile configuration.
 */
export interface AgentProfile {
  id: ProfileId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  model: ModelName;
  thinkingLevel: ThinkingLevel;
}

/**
 * Model configuration for a specific task phase.
 */
export interface PhaseModelConfig {
  model: ModelName;
  thinkingLevel: ThinkingLevel;
}

/**
 * Per-phase model configuration for a task.
 * Allows different models/thinking levels for each phase.
 */
export interface PhaseConfig {
  specCreation: PhaseModelConfig;
  planning: PhaseModelConfig;
  coding: PhaseModelConfig;
  qaReview: PhaseModelConfig;
}

/**
 * Task agent configuration stored in the database.
 */
export interface TaskAgentConfig {
  profileId: ProfileId;
  phaseConfig: PhaseConfig;
  customSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

/**
 * User preferences for agent profiles.
 */
export interface UserAgentPreferences {
  defaultProfileId: ProfileId;
  customPhaseConfig?: Partial<PhaseConfig>;
  savedCustomProfiles?: AgentProfile[];
}
