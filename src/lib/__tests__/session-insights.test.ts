import { describe, it, expect } from 'vitest';
import {
  parseTerminalOutput,
  extractKeyTopics,
  generateSessionSummary,
  formatMemoryContent,
  generateMemoryTitle,
} from '../session-insights';

describe('Session Insights', () => {
  describe('parseTerminalOutput', () => {
    it('should detect accomplishments from git commits', () => {
      const output = `
$ git commit -m "feat: add new feature"
Successfully committed changes
      `;
      const insights = parseTerminalOutput(output);
      const accomplishments = insights.filter(i => i.type === 'accomplishment');
      expect(accomplishments.length).toBeGreaterThan(0);
    });

    it('should detect errors', () => {
      const output = `
Error: Failed to compile
TypeError: Cannot read property 'name' of undefined
      `;
      const insights = parseTerminalOutput(output);
      const errors = insights.filter(i => i.type === 'error');
      expect(errors.length).toBe(2);
    });

    it('should detect commands', () => {
      const output = `
$ npm install react
$ git status
$ docker compose up -d
      `;
      const insights = parseTerminalOutput(output);
      const commands = insights.filter(i => i.type === 'command');
      expect(commands.length).toBe(3);
    });

    it('should detect patterns and notes', () => {
      const output = `
# Note: Remember to run migrations before deploying
# Pattern: Always use async/await for database operations
      `;
      const insights = parseTerminalOutput(output);
      const patterns = insights.filter(i => i.type === 'pattern');
      expect(patterns.length).toBe(2);
    });

    it('should ignore basic navigation commands', () => {
      const output = `
$ cd /home/user
$ ls -la
$ pwd
$ clear
      `;
      const insights = parseTerminalOutput(output);
      const commands = insights.filter(i => i.type === 'command');
      expect(commands.length).toBe(0);
    });
  });

  describe('extractKeyTopics', () => {
    it('should extract git topic from git operations', () => {
      const output = `
$ git add .
$ git commit -m "fix: resolve bug"
$ git push
      `;
      const topics = extractKeyTopics(output);
      expect(topics).toContain('git');
      expect(topics).toContain('fix');
    });

    it('should extract dependencies topic from npm operations', () => {
      const output = `
$ npm install express
added 50 packages
      `;
      const topics = extractKeyTopics(output);
      expect(topics).toContain('dependencies');
    });

    it('should extract build topic from build operations', () => {
      const output = `
$ npm run build
Build completed successfully
      `;
      const topics = extractKeyTopics(output);
      expect(topics).toContain('build');
    });

    it('should extract database topic from prisma operations', () => {
      const output = `
$ npx prisma migrate dev
Migration applied successfully
      `;
      const topics = extractKeyTopics(output);
      expect(topics).toContain('database');
    });

    it('should extract docker topic from docker operations', () => {
      const output = `
$ docker compose up -d
Creating network "app_default"
      `;
      const topics = extractKeyTopics(output);
      expect(topics).toContain('docker');
    });
  });

  describe('generateSessionSummary', () => {
    it('should generate summary with correct metrics', () => {
      const insights = [
        { type: 'command' as const, content: 'npm test' },
        { type: 'accomplishment' as const, content: 'All tests passed' },
        { type: 'error' as const, content: 'Error: Test failed' },
        { type: 'command' as const, content: 'git commit' },
      ];
      const startTime = new Date('2024-01-01T10:00:00');
      const endTime = new Date('2024-01-01T10:30:00');

      const summary = generateSessionSummary(insights, startTime, endTime);

      expect(summary.commandCount).toBe(2);
      expect(summary.errorCount).toBe(1);
      expect(summary.successCount).toBe(1);
      expect(summary.duration).toBe(30 * 60 * 1000); // 30 minutes
    });
  });

  describe('formatMemoryContent', () => {
    it('should format memory content with all sections', () => {
      const summary = {
        duration: 45 * 60 * 1000, // 45 minutes
        commandCount: 10,
        insights: [
          { type: 'accomplishment' as const, content: 'Successfully committed changes' },
          { type: 'error' as const, content: 'Error: Build failed', context: 'Fixed by updating dependencies' },
          { type: 'pattern' as const, content: 'Note: Always run tests before commit' },
          { type: 'command' as const, content: 'npm test' },
        ],
        keyTopics: ['git', 'testing'],
        errorCount: 1,
        successCount: 1,
      };

      const content = formatMemoryContent(summary, 'term-123');

      expect(content).toContain('# Terminal Session Summary');
      expect(content).toContain('**Session ID:** term-123');
      expect(content).toContain('45m');
      expect(content).toContain('**Commands Executed:** 10');
      expect(content).toContain('git, testing');
      expect(content).toContain('## Accomplishments');
      expect(content).toContain('## Errors Encountered');
      expect(content).toContain('## Patterns & Learnings');
      expect(content).toContain('## Key Commands');
    });

    it('should handle sessions with no errors', () => {
      const summary = {
        duration: 15 * 60 * 1000,
        commandCount: 5,
        insights: [
          { type: 'accomplishment' as const, content: 'Build successful' },
          { type: 'command' as const, content: 'npm run build' },
        ],
        keyTopics: ['build'],
        errorCount: 0,
        successCount: 1,
      };

      const content = formatMemoryContent(summary, 'term-456');

      expect(content).toContain('## Accomplishments');
      expect(content).not.toContain('## Errors Encountered');
    });
  });

  describe('generateMemoryTitle', () => {
    it('should generate title with topics', () => {
      const summary = {
        duration: 30 * 60 * 1000,
        commandCount: 8,
        insights: [],
        keyTopics: ['git', 'testing', 'build'],
        errorCount: 0,
        successCount: 2,
      };

      const title = generateMemoryTitle(summary, 'Main Terminal');

      expect(title).toContain('Main Terminal');
      expect(title).toContain('git, testing');
    });

    it('should generate fallback title when no topics', () => {
      const summary = {
        duration: 10 * 60 * 1000,
        commandCount: 2,
        insights: [],
        keyTopics: [],
        errorCount: 0,
        successCount: 0,
      };

      const title = generateMemoryTitle(summary, 'Terminal 1');

      expect(title).toContain('Terminal 1 Session');
    });
  });
});
