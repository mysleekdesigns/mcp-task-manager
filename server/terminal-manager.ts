import * as pty from 'node-pty';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  projectId: string;
  worktreeId?: string;
  cwd: string;
  outputBuffer: string[];
  startTime: Date;
  commandCount: number;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();
  private readonly MAX_BUFFER_SIZE = 10000; // Max lines to store

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

    const session: TerminalSession = {
      id,
      pty: ptyProcess,
      projectId,
      worktreeId,
      cwd,
      outputBuffer: [],
      startTime: new Date(),
      commandCount: 0,
    };

    // Capture output for session insights
    ptyProcess.onData((data) => {
      this.captureOutput(id, data);
    });

    this.sessions.set(id, session);
    return ptyProcess;
  }

  /**
   * Capture terminal output to buffer for session insights
   */
  private captureOutput(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session) return;

    // Add to buffer
    session.outputBuffer.push(data);

    // Detect command execution (lines ending with newline after prompt)
    if (data.includes('\n') && !data.match(/^[\s\r\n]*$/)) {
      session.commandCount++;
    }

    // Prevent buffer from growing too large
    if (session.outputBuffer.length > this.MAX_BUFFER_SIZE) {
      session.outputBuffer = session.outputBuffer.slice(-this.MAX_BUFFER_SIZE);
    }
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

  /**
   * Get session metadata for insight capture
   */
  getSessionMetadata(id: string): {
    outputBuffer: string;
    startTime: Date;
    endTime: Date;
    commandCount: number;
    projectId: string;
    worktreeId?: string;
    cwd: string;
  } | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    return {
      outputBuffer: session.outputBuffer.join(''),
      startTime: session.startTime,
      endTime: new Date(),
      commandCount: session.commandCount,
      projectId: session.projectId,
      worktreeId: session.worktreeId,
      cwd: session.cwd,
    };
  }
}
