/**
 * Agent Profile System Utilities
 *
 * Provides preset profiles and utilities for configuring AI model behavior.
 */

import type {
  AgentProfile,
  ModelName,
  PhaseConfig,
  PhaseModelConfig,
  ProfileId,
  ThinkingLevel,
} from '@/types/agent-profiles';

/**
 * Preset agent profiles.
 * These provide optimized configurations for different use cases.
 */
export const AGENT_PROFILES: Record<ProfileId, AgentProfile> = {
  auto: {
    id: 'auto',
    name: 'Auto (Optimized)',
    description: 'Automatically optimized for best results. Uses Opus with high thinking for complex reasoning.',
    icon: 'Sparkles',
    model: 'opus-4-5',
    thinkingLevel: 'high',
  },
  complex: {
    id: 'complex',
    name: 'Complex Tasks',
    description: 'Maximum reasoning power for intricate problems. Uses Opus with ultrathink mode.',
    icon: 'Brain',
    model: 'opus-4-5',
    thinkingLevel: 'ultrathink',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance of speed and quality. Uses Sonnet with medium thinking.',
    icon: 'Scale',
    model: 'sonnet-4-5',
    thinkingLevel: 'medium',
  },
  quick: {
    id: 'quick',
    name: 'Quick Edits',
    description: 'Fast responses for simple changes. Uses Haiku with low thinking.',
    icon: 'Zap',
    model: 'haiku-4-5',
    thinkingLevel: 'low',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Fully customizable per-phase settings. Configure each phase individually.',
    icon: 'Settings',
    model: 'sonnet-4-5',
    thinkingLevel: 'medium',
  },
};

/**
 * Get default phase configuration based on profile.
 *
 * @param profileId - The profile to get configuration for
 * @returns PhaseConfig with model settings for each phase
 */
export function getDefaultPhaseConfig(profileId: ProfileId): PhaseConfig {
  const profile = AGENT_PROFILES[profileId];

  // For custom profile, return a balanced default that user can modify
  if (profileId === 'custom') {
    return {
      specCreation: { model: 'opus-4-5', thinkingLevel: 'high' },
      planning: { model: 'sonnet-4-5', thinkingLevel: 'medium' },
      coding: { model: 'sonnet-4-5', thinkingLevel: 'medium' },
      qaReview: { model: 'opus-4-5', thinkingLevel: 'high' },
    };
  }

  // For preset profiles, use the same config across all phases
  const baseConfig: PhaseModelConfig = {
    model: profile.model,
    thinkingLevel: profile.thinkingLevel,
  };

  return {
    specCreation: { ...baseConfig },
    planning: { ...baseConfig },
    coding: { ...baseConfig },
    qaReview: { ...baseConfig },
  };
}

/**
 * Get a specific phase configuration.
 *
 * @param phaseConfig - The full phase configuration
 * @param phaseName - The phase to get config for
 * @returns Model configuration for the specified phase
 */
export function getPhaseModelConfig(
  phaseConfig: PhaseConfig,
  phaseName: keyof PhaseConfig
): PhaseModelConfig {
  return phaseConfig[phaseName];
}

/**
 * Check if a profile is using custom per-phase settings.
 *
 * @param phaseConfig - The phase configuration to check
 * @returns True if phases have different configurations
 */
export function hasCustomPhaseSettings(phaseConfig: PhaseConfig): boolean {
  const configs = [
    phaseConfig.specCreation,
    phaseConfig.planning,
    phaseConfig.coding,
    phaseConfig.qaReview,
  ];

  // Check if all phases have the same model and thinking level
  const firstConfig = configs[0];
  return !configs.every(
    (config) =>
      config.model === firstConfig.model &&
      config.thinkingLevel === firstConfig.thinkingLevel
  );
}

/**
 * Get a human-readable label for a model.
 *
 * @param model - The model name
 * @returns Display label
 */
export function getModelLabel(model: ModelName): string {
  const labels: Record<ModelName, string> = {
    'opus-4-5': 'Claude Opus 4.5',
    'sonnet-4-5': 'Claude Sonnet 4.5',
    'haiku-4-5': 'Claude Haiku 4.5',
  };
  return labels[model];
}

/**
 * Get a human-readable label for a thinking level.
 *
 * @param level - The thinking level
 * @returns Display label
 */
export function getThinkingLevelLabel(level: ThinkingLevel): string {
  const labels: Record<ThinkingLevel, string> = {
    low: 'Low (Fast)',
    medium: 'Medium',
    high: 'High',
    ultrathink: 'Ultra Think',
  };
  return labels[level];
}

/**
 * Get a description for a thinking level.
 *
 * @param level - The thinking level
 * @returns Description text
 */
export function getThinkingLevelDescription(level: ThinkingLevel): string {
  const descriptions: Record<ThinkingLevel, string> = {
    low: 'Quick responses for straightforward tasks',
    medium: 'Balanced reasoning for most tasks',
    high: 'Extended thinking for complex problems',
    ultrathink: 'Maximum reasoning capacity for intricate challenges',
  };
  return descriptions[level];
}

/**
 * Validate if a phase config is valid.
 *
 * @param config - The config to validate
 * @returns True if valid
 */
export function isValidPhaseConfig(config: PhaseConfig): boolean {
  const phases: Array<keyof PhaseConfig> = [
    'specCreation',
    'planning',
    'coding',
    'qaReview',
  ];

  return phases.every((phase) => {
    const phaseConfig = config[phase];
    return (
      phaseConfig &&
      typeof phaseConfig.model === 'string' &&
      typeof phaseConfig.thinkingLevel === 'string'
    );
  });
}

/**
 * Get recommended profile for a task based on complexity.
 *
 * @param complexity - Estimated complexity (1-10)
 * @param urgency - How urgent the task is ('low' | 'medium' | 'high')
 * @returns Recommended profile ID
 */
export function getRecommendedProfile(
  complexity: number,
  urgency: 'low' | 'medium' | 'high'
): ProfileId {
  // High urgency + low complexity = quick
  if (urgency === 'high' && complexity <= 3) {
    return 'quick';
  }

  // Very high complexity = complex profile
  if (complexity >= 8) {
    return 'complex';
  }

  // Medium complexity = balanced
  if (complexity >= 4 && complexity <= 7) {
    return 'balanced';
  }

  // Default to auto for everything else
  return 'auto';
}

/**
 * Merge custom phase config with default config.
 *
 * @param profileId - Base profile ID
 * @param customConfig - Custom overrides (partial)
 * @returns Complete merged configuration
 */
export function mergePhaseConfig(
  profileId: ProfileId,
  customConfig?: Partial<PhaseConfig>
): PhaseConfig {
  const defaultConfig = getDefaultPhaseConfig(profileId);

  if (!customConfig) {
    return defaultConfig;
  }

  return {
    specCreation: customConfig.specCreation || defaultConfig.specCreation,
    planning: customConfig.planning || defaultConfig.planning,
    coding: customConfig.coding || defaultConfig.coding,
    qaReview: customConfig.qaReview || defaultConfig.qaReview,
  };
}
