/**
 * Session Insight Capture Utility
 *
 * Analyzes terminal session output to extract meaningful insights including:
 * - Completed tasks and accomplishments
 * - Error patterns and resolutions
 * - Learned patterns and best practices
 * - Key commands and workflows
 */

export interface SessionInsight {
  type: 'accomplishment' | 'error' | 'pattern' | 'command' | 'conversation';
  content: string;
  context?: string;
  timestamp?: Date;
}

export interface SessionSummary {
  duration: number; // in milliseconds
  commandCount: number;
  insights: SessionInsight[];
  keyTopics: string[];
  errorCount: number;
  successCount: number;
}

/**
 * Parse terminal output to extract insights
 */
export function parseTerminalOutput(output: string): SessionInsight[] {
  const insights: SessionInsight[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect accomplishments (git commits, npm install, build success, etc.)
    if (
      line.match(/Successfully committed|Commit created|git commit.*successful/i) ||
      line.match(/Successfully installed|added \d+ packages/i) ||
      line.match(/Build completed|Compiled successfully/i) ||
      line.match(/Test[s]? passed|All tests passed/i)
    ) {
      insights.push({
        type: 'accomplishment',
        content: extractContext(lines, i, 2),
        timestamp: new Date(),
      });
    }

    // Detect errors and their context
    if (
      line.match(/Error:|ERROR:|Failed to|Exception:|TypeError:|ReferenceError:/i)
    ) {
      const errorContext = extractContext(lines, i, 3);
      insights.push({
        type: 'error',
        content: errorContext,
        context: extractErrorSolution(lines, i),
        timestamp: new Date(),
      });
    }

    // Detect important commands (excluding basic navigation)
    if (line.match(/^\$\s|^>\s/)) { // Command prompt
      const command = line.replace(/^[$>]\s*/, '').trim();
      // Exclude basic navigation commands
      if (
        command.length > 0 &&
        !command.match(/^(cd|ls|pwd|clear)(\s|$)/)
      ) {
        insights.push({
          type: 'command',
          content: command,
          timestamp: new Date(),
        });
      }
    }

    // Detect patterns and best practices
    if (
      line.match(/# Note:|# Pattern:|# Best practice:|# Remember:/i) ||
      line.match(/\/\/ TODO:|\/\/ FIXME:|\/\/ IMPORTANT:/i)
    ) {
      insights.push({
        type: 'pattern',
        content: extractContext(lines, i, 1),
        timestamp: new Date(),
      });
    }
  }

  return insights;
}

/**
 * Extract surrounding context for an insight
 */
function extractContext(lines: string[], index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length, index + radius + 1);
  return lines.slice(start, end).join('\n').trim();
}

/**
 * Try to extract error solution from following lines
 */
function extractErrorSolution(lines: string[], errorIndex: number): string | undefined {
  const solutionLines: string[] = [];
  for (let i = errorIndex + 1; i < Math.min(errorIndex + 10, lines.length); i++) {
    const line = lines[i];
    if (line.match(/Fixed|Resolved|Solution:|Workaround:|Try:/i)) {
      solutionLines.push(line);
    }
  }
  return solutionLines.length > 0 ? solutionLines.join('\n') : undefined;
}

/**
 * Extract key topics from session output
 */
export function extractKeyTopics(output: string): string[] {
  const topics = new Set<string>();

  // Extract from git commits
  const commitMatches = output.matchAll(/git commit.*-m\s+"([^"]+)"/gi);
  for (const match of commitMatches) {
    const message = match[1];
    // Extract first word (usually the type: feat, fix, etc.)
    const type = message.split(':')[0]?.trim();
    if (type) topics.add(type);
  }

  // Extract from npm/package operations
  if (output.match(/npm install|yarn add|pnpm add/i)) {
    topics.add('dependencies');
  }

  // Extract from build/test operations
  if (output.match(/npm run build|next build|vite build/i)) {
    topics.add('build');
  }
  if (output.match(/npm test|npm run test|vitest|jest/i)) {
    topics.add('testing');
  }

  // Extract from file operations
  if (output.match(/mkdir|touch|rm|mv|cp/i)) {
    topics.add('file-management');
  }

  // Extract from git operations
  if (output.match(/git (add|commit|push|pull|merge|rebase|checkout)/i)) {
    topics.add('git');
  }

  // Extract from docker operations
  if (output.match(/docker|docker-compose/i)) {
    topics.add('docker');
  }

  // Extract from database operations
  if (output.match(/prisma|migrate|psql|postgres/i)) {
    topics.add('database');
  }

  return Array.from(topics);
}

/**
 * Generate a summary from session insights
 */
export function generateSessionSummary(
  insights: SessionInsight[],
  startTime: Date,
  endTime: Date
): SessionSummary {
  const duration = endTime.getTime() - startTime.getTime();

  const commandCount = insights.filter(i => i.type === 'command').length;
  const errorCount = insights.filter(i => i.type === 'error').length;
  const successCount = insights.filter(i => i.type === 'accomplishment').length;

  // Extract key topics from all insights
  const allContent = insights.map(i => i.content).join('\n');
  const keyTopics = extractKeyTopics(allContent);

  return {
    duration,
    commandCount,
    insights,
    keyTopics,
    errorCount,
    successCount,
  };
}

/**
 * Create a formatted memory content from session summary
 */
export function formatMemoryContent(summary: SessionSummary, sessionId: string): string {
  const hours = Math.floor(summary.duration / (1000 * 60 * 60));
  const minutes = Math.floor((summary.duration % (1000 * 60 * 60)) / (1000 * 60));

  let content = `# Terminal Session Summary\n\n`;
  content += `**Session ID:** ${sessionId}\n`;
  content += `**Duration:** ${hours > 0 ? `${hours}h ` : ''}${minutes}m\n`;
  content += `**Commands Executed:** ${summary.commandCount}\n`;
  content += `**Topics:** ${summary.keyTopics.join(', ') || 'General development'}\n\n`;

  // Accomplishments section
  const accomplishments = summary.insights.filter(i => i.type === 'accomplishment');
  if (accomplishments.length > 0) {
    content += `## Accomplishments\n\n`;
    accomplishments.forEach((insight, idx) => {
      content += `${idx + 1}. ${insight.content.split('\n')[0]}\n`;
    });
    content += `\n`;
  }

  // Errors and resolutions
  const errors = summary.insights.filter(i => i.type === 'error');
  if (errors.length > 0) {
    content += `## Errors Encountered\n\n`;
    errors.forEach((insight, idx) => {
      content += `${idx + 1}. ${insight.content.split('\n')[0]}\n`;
      if (insight.context) {
        content += `   - Resolution: ${insight.context}\n`;
      }
    });
    content += `\n`;
  }

  // Patterns and learnings
  const patterns = summary.insights.filter(i => i.type === 'pattern');
  if (patterns.length > 0) {
    content += `## Patterns & Learnings\n\n`;
    patterns.forEach((insight, idx) => {
      content += `${idx + 1}. ${insight.content}\n`;
    });
    content += `\n`;
  }

  // Key commands
  const commands = summary.insights.filter(i => i.type === 'command');
  if (commands.length > 0 && commands.length <= 20) {
    content += `## Key Commands\n\n`;
    // Deduplicate commands
    const uniqueCommands = [...new Set(commands.map(c => c.content))];
    uniqueCommands.slice(0, 10).forEach(cmd => {
      content += `- \`${cmd}\`\n`;
    });
    content += `\n`;
  }

  return content;
}

/**
 * Create memory title from session summary
 */
export function generateMemoryTitle(summary: SessionSummary, terminalName: string): string {
  const date = new Date().toLocaleDateString();
  const topics = summary.keyTopics.slice(0, 2).join(', ');

  if (topics) {
    return `${terminalName}: ${topics} - ${date}`;
  }

  return `${terminalName} Session - ${date}`;
}
