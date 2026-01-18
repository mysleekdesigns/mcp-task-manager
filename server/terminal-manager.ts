import * as pty from 'node-pty';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  projectId: string;
  worktreeId?: string;
  cwd: string;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();

  spawn(
    id: string,
    cwd: string,
    projectId: string,
    worktreeId?: string
  ): pty.IPty {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as { [key: string]: string },
    });

    this.sessions.set(id, { id, pty: ptyProcess, projectId, worktreeId, cwd });
    return ptyProcess;
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.pty.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    this.sessions.get(id)?.pty.resize(cols, rows);
  }

  kill(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.kill();
      this.sessions.delete(id);
    }
  }

  get(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  getAll(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  getAllForProject(projectId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.projectId === projectId
    );
  }

  killAll(): void {
    for (const session of this.sessions.values()) {
      session.pty.kill();
    }
    this.sessions.clear();
  }
}
