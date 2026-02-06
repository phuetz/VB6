/**
 * Git Integration Service for VB6 IDE
 *
 * Provides version control capabilities through Git
 */

import { createLogger } from './LoggingService';

const logger = createLogger('Git');

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
}

export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string; // For renamed files
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  lastCommit?: GitCommit;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push' | 'both';
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  chunks: GitDiffChunk[];
}

export interface GitDiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export class GitIntegrationService {
  private baseUrl: string;
  private isSimulated: boolean;

  constructor(baseUrl: string = '/api/git', simulated: boolean = true) {
    this.baseUrl = baseUrl;
    this.isSimulated = simulated;
  }

  /**
   * Initialize a new Git repository
   */
  async init(): Promise<boolean> {
    if (this.isSimulated) {
      return this.simulateInit();
    }

    try {
      const response = await fetch(`${this.baseUrl}/init`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to initialize Git repository:', error);
      return false;
    }
  }

  /**
   * Get current Git status
   */
  async getStatus(): Promise<GitStatus> {
    if (this.isSimulated) {
      return this.simulateStatus();
    }

    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) throw new Error('Failed to get Git status');
      return await response.json();
    } catch (error) {
      logger.error('Failed to get Git status:', error);
      return this.getEmptyStatus();
    }
  }

  /**
   * Stage files for commit
   */
  async stage(paths: string[]): Promise<boolean> {
    if (this.isSimulated) {
      return this.simulateStage(paths);
    }

    try {
      const response = await fetch(`${this.baseUrl}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to stage files:', error);
      return false;
    }
  }

  /**
   * Unstage files
   */
  async unstage(paths: string[]): Promise<boolean> {
    if (this.isSimulated) {
      return this.simulateUnstage(paths);
    }

    try {
      const response = await fetch(`${this.baseUrl}/unstage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to unstage files:', error);
      return false;
    }
  }

  /**
   * Commit staged changes
   */
  async commit(message: string, author?: string, email?: string): Promise<string | null> {
    if (this.isSimulated) {
      return this.simulateCommit(message);
    }

    try {
      const response = await fetch(`${this.baseUrl}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, author, email }),
      });

      if (!response.ok) throw new Error('Failed to commit');

      const result = await response.json();
      return result.hash;
    } catch (error) {
      logger.error('Failed to commit:', error);
      return null;
    }
  }

  /**
   * Get commit history
   */
  async getHistory(limit: number = 50, skip: number = 0): Promise<GitCommit[]> {
    if (this.isSimulated) {
      return this.simulateHistory(limit, skip);
    }

    try {
      const response = await fetch(`${this.baseUrl}/history?limit=${limit}&skip=${skip}`);
      if (!response.ok) throw new Error('Failed to get history');
      return await response.json();
    } catch (error) {
      logger.error('Failed to get history:', error);
      return [];
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<GitBranch[]> {
    if (this.isSimulated) {
      return this.simulateBranches();
    }

    try {
      const response = await fetch(`${this.baseUrl}/branches`);
      if (!response.ok) throw new Error('Failed to get branches');
      return await response.json();
    } catch (error) {
      logger.error('Failed to get branches:', error);
      return [];
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string, checkout: boolean = true): Promise<boolean> {
    if (this.isSimulated) {
      return this.simulateCreateBranch(name);
    }

    try {
      const response = await fetch(`${this.baseUrl}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, checkout }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to create branch:', error);
      return false;
    }
  }

  /**
   * Switch to a different branch
   */
  async checkout(branch: string): Promise<boolean> {
    if (this.isSimulated) {
      return this.simulateCheckout(branch);
    }

    try {
      const response = await fetch(`${this.baseUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to checkout branch:', error);
      return false;
    }
  }

  /**
   * Merge a branch into current branch
   */
  async merge(branch: string): Promise<{ success: boolean; conflicts?: string[] }> {
    if (this.isSimulated) {
      return this.simulateMerge(branch);
    }

    try {
      const response = await fetch(`${this.baseUrl}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, conflicts: error.conflicts };
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to merge branch:', error);
      return { success: false };
    }
  }

  /**
   * Get diff for a file
   */
  async getDiff(path: string, staged: boolean = false): Promise<GitDiff | null> {
    if (this.isSimulated) {
      return this.simulateDiff(path);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/diff?path=${encodeURIComponent(path)}&staged=${staged}`
      );
      if (!response.ok) throw new Error('Failed to get diff');
      return await response.json();
    } catch (error) {
      logger.error('Failed to get diff:', error);
      return null;
    }
  }

  /**
   * Get list of remotes
   */
  async getRemotes(): Promise<GitRemote[]> {
    if (this.isSimulated) {
      return this.simulateRemotes();
    }

    try {
      const response = await fetch(`${this.baseUrl}/remotes`);
      if (!response.ok) throw new Error('Failed to get remotes');
      return await response.json();
    } catch (error) {
      logger.error('Failed to get remotes:', error);
      return [];
    }
  }

  /**
   * Add a remote
   */
  async addRemote(name: string, url: string): Promise<boolean> {
    if (this.isSimulated) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/remotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to add remote:', error);
      return false;
    }
  }

  /**
   * Push to remote
   */
  async push(remote: string = 'origin', branch?: string): Promise<boolean> {
    if (this.isSimulated) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remote, branch }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to push:', error);
      return false;
    }
  }

  /**
   * Pull from remote
   */
  async pull(
    remote: string = 'origin',
    branch?: string
  ): Promise<{ success: boolean; conflicts?: string[] }> {
    if (this.isSimulated) {
      return { success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remote, branch }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, conflicts: error.conflicts };
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to pull:', error);
      return { success: false };
    }
  }

  /**
   * Clone a repository
   */
  async clone(url: string, directory?: string): Promise<boolean> {
    if (this.isSimulated) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, directory }),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to clone repository:', error);
      return false;
    }
  }

  // Simulation methods for development

  private simulateInit(): boolean {
    logger.debug('Simulated: Git repository initialized');
    return true;
  }

  private simulateStatus(): GitStatus {
    return {
      branch: 'main',
      ahead: 2,
      behind: 0,
      staged: [
        { path: 'src/Form1.frm', status: 'modified' },
        { path: 'src/Module1.bas', status: 'added' },
      ],
      unstaged: [{ path: 'src/Form2.frm', status: 'modified' }],
      untracked: ['src/Test.frm', 'docs/README.md'],
    };
  }

  private simulateStage(paths: string[]): boolean {
    logger.debug('Simulated: Staged files:', paths);
    return true;
  }

  private simulateUnstage(paths: string[]): boolean {
    logger.debug('Simulated: Unstaged files:', paths);
    return true;
  }

  private simulateCommit(message: string): string {
    const hash = Math.random().toString(36).substring(2, 9);
    logger.debug('Simulated: Created commit', hash, 'with message:', message);
    return hash;
  }

  private simulateHistory(limit: number, skip: number): GitCommit[] {
    const commits: GitCommit[] = [];
    const messages = [
      'Initial commit',
      'Add main form',
      'Implement login functionality',
      'Fix database connection',
      'Update UI components',
      'Add error handling',
      'Refactor code structure',
      'Add unit tests',
      'Fix memory leak',
      'Update documentation',
    ];

    for (let i = skip; i < Math.min(skip + limit, 10); i++) {
      commits.push({
        hash: Math.random().toString(36).substring(2, 9),
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        message: messages[i % messages.length],
      });
    }

    return commits;
  }

  private simulateBranches(): GitBranch[] {
    return [
      { name: 'main', current: true },
      { name: 'develop', current: false },
      { name: 'feature/login', current: false },
      { name: 'bugfix/memory-leak', current: false },
    ];
  }

  private simulateCreateBranch(name: string): boolean {
    logger.debug('Simulated: Created branch', name);
    return true;
  }

  private simulateCheckout(branch: string): boolean {
    logger.debug('Simulated: Switched to branch', branch);
    return true;
  }

  private simulateMerge(branch: string): { success: boolean; conflicts?: string[] } {
    logger.debug('Simulated: Merged branch', branch);
    // Simulate occasional conflicts
    if (Math.random() > 0.8) {
      return {
        success: false,
        conflicts: ['src/Form1.frm', 'src/Module1.bas'],
      };
    }
    return { success: true };
  }

  private simulateDiff(path: string): GitDiff {
    return {
      file: path,
      additions: 15,
      deletions: 5,
      chunks: [
        {
          oldStart: 10,
          oldLines: 5,
          newStart: 10,
          newLines: 8,
          lines: [
            { type: 'context', content: 'Private Sub Form_Load()', oldLine: 10, newLine: 10 },
            { type: 'delete', content: '    MsgBox "Hello"', oldLine: 11 },
            { type: 'add', content: '    Dim message As String', newLine: 11 },
            { type: 'add', content: '    message = "Hello, World!"', newLine: 12 },
            { type: 'add', content: '    MsgBox message', newLine: 13 },
            { type: 'context', content: 'End Sub', oldLine: 12, newLine: 14 },
          ],
        },
      ],
    };
  }

  private simulateRemotes(): GitRemote[] {
    return [{ name: 'origin', url: 'https://github.com/user/vb6-project.git', type: 'both' }];
  }

  private getEmptyStatus(): GitStatus {
    return {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
    };
  }
}

// Export singleton instance
export const gitService = new GitIntegrationService();
