export interface McpConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  projectId: string;
  createdAt: string;
}

export type McpServerType =
  | 'documentation'
  | 'knowledge'
  | 'integration'
  | 'browser'
  | 'builtin'
  | 'custom';

export interface McpServerTemplate {
  id: string;
  name: string;
  description: string;
  type: McpServerType;
  category: string;
  icon?: string;
  defaultConfig?: Record<string, unknown>;
}

export const MCP_SERVER_TEMPLATES: McpServerTemplate[] = [
  {
    id: 'electron',
    name: 'Electron Browser',
    description: 'Browser automation with Electron',
    type: 'browser',
    category: 'Browser Automation',
    icon: 'Globe',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Headless browser automation',
    type: 'browser',
    category: 'Browser Automation',
    icon: 'Chrome',
  },
  {
    id: 'crawlforge',
    name: 'CrawlForge',
    description: 'Web scraping, crawling, and content extraction',
    type: 'browser',
    category: 'Browser Automation',
    icon: 'Spider',
  },
  {
    id: 'context7',
    name: 'Context7',
    description: 'AI-powered documentation search and indexing',
    type: 'documentation',
    category: 'Documentation',
    icon: 'FileText',
  },
  {
    id: 'contextforge',
    name: 'ContextForge',
    description: 'Contextual memory management and storage',
    type: 'knowledge',
    category: 'Knowledge Graphs',
    icon: 'Brain',
  },
  {
    id: 'graphiti',
    name: 'Graphiti Memory',
    description: 'Graph-based memory and knowledge representation',
    type: 'knowledge',
    category: 'Knowledge Graphs',
    icon: 'Network',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Linear issue tracking integration',
    type: 'integration',
    category: 'Integrations',
    icon: 'Box',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub API integration for repos and issues',
    type: 'integration',
    category: 'Integrations',
    icon: 'Github',
  },
  {
    id: 'claude-tasks-tools',
    name: 'Claude Tasks Tools',
    description: 'Built-in tools for task management and workflows',
    type: 'builtin',
    category: 'Built-in',
    icon: 'Wrench',
  },
];
