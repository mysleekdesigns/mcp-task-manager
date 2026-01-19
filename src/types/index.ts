/**
 * Type definitions for Claude Tasks MCP Task Manager
 * Add shared types and interfaces here
 */

export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'AI_REVIEW'
  | 'HUMAN_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type PhaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type MoscowPriority = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
