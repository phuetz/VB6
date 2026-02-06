import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  GitFork,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Plus,
  RefreshCw,
  Upload,
  Download,
  FileText,
  FilePlus,
  FileMinus,
  FileEdit,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  gitService,
  GitStatus,
  GitCommit as GitCommitType,
  GitBranch as GitBranchType,
} from '../../services/GitIntegrationService';

interface GitPanelProps {
  className?: string;
}

const GitPanel: React.FC<GitPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commitHistory, setCommitHistory] = useState<GitCommitType[]>([]);
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadGitData();
  }, []);

  const loadGitData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [status, history, branchList] = await Promise.all([
        gitService.getStatus(),
        gitService.getHistory(20),
        gitService.getBranches(),
      ]);

      setGitStatus(status);
      setCommitHistory(history);
      setBranches(branchList);
    } catch (err) {
      setError('Failed to load Git data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageFile = async (path: string) => {
    try {
      await gitService.stage([path]);
      await loadGitData();
    } catch (err) {
      setError('Failed to stage file');
    }
  };

  const handleUnstageFile = async (path: string) => {
    try {
      await gitService.unstage([path]);
      await loadGitData();
    } catch (err) {
      setError('Failed to unstage file');
    }
  };

  const handleStageSelected = async () => {
    const files = Array.from(selectedFiles);
    if (files.length === 0) return;

    try {
      await gitService.stage(files);
      setSelectedFiles(new Set());
      await loadGitData();
    } catch (err) {
      setError('Failed to stage selected files');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError('Please enter a commit message');
      return;
    }

    try {
      const hash = await gitService.commit(commitMessage);
      if (hash) {
        setCommitMessage('');
        await loadGitData();
      } else {
        setError('Failed to create commit');
      }
    } catch (err) {
      setError('Failed to commit changes');
    }
  };

  const handleCreateBranch = async () => {
    const branchName = prompt('Enter new branch name:');
    if (!branchName) return;

    try {
      await gitService.createBranch(branchName);
      await loadGitData();
    } catch (err) {
      setError('Failed to create branch');
    }
  };

  const handleCheckoutBranch = async (branchName: string) => {
    try {
      await gitService.checkout(branchName);
      await loadGitData();
    } catch (err) {
      setError(`Failed to checkout branch: ${branchName}`);
    }
  };

  const handlePush = async () => {
    try {
      await gitService.push();
      await loadGitData();
    } catch (err) {
      setError('Failed to push changes');
    }
  };

  const handlePull = async () => {
    try {
      const result = await gitService.pull();
      if (!result.success && result.conflicts) {
        setError(`Pull failed due to conflicts in: ${result.conflicts.join(', ')}`);
      } else {
        await loadGitData();
      }
    } catch (err) {
      setError('Failed to pull changes');
    }
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <FilePlus size={16} className="text-green-600" />;
      case 'modified':
        return <FileEdit size={16} className="text-blue-600" />;
      case 'deleted':
        return <FileMinus size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const renderChangesTab = () => {
    if (!gitStatus) return null;

    const allFiles = [
      ...gitStatus.staged.map(f => ({ ...f, staged: true })),
      ...gitStatus.unstaged.map(f => ({ ...f, staged: false })),
      ...gitStatus.untracked.map(f => ({ path: f, status: 'added' as const, staged: false })),
    ];

    return (
      <div className="flex-1 flex flex-col">
        {/* Commit message input */}
        <div className="p-3 border-b">
          <textarea
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            placeholder="Enter commit message..."
            className="w-full p-2 text-xs border rounded resize-none"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || gitStatus.staged.length === 0}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              <GitCommit size={14} className="inline mr-1" />
              Commit
            </button>
            <button
              onClick={handleStageSelected}
              disabled={selectedFiles.size === 0}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:bg-gray-300"
            >
              <Plus size={14} className="inline mr-1" />
              Stage Selected
            </button>
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto">
          {allFiles.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs">No changes to commit</div>
          ) : (
            <div className="p-2">
              {allFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-1 hover:bg-gray-100 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.path)}
                    onChange={e => {
                      const newSelected = new Set(selectedFiles);
                      if (e.target.checked) {
                        newSelected.add(file.path);
                      } else {
                        newSelected.delete(file.path);
                      }
                      setSelectedFiles(newSelected);
                    }}
                    disabled={file.staged}
                  />
                  {getFileIcon(file.status)}
                  <span className="flex-1 truncate">{file.path}</span>
                  {file.staged ? (
                    <button
                      onClick={() => handleUnstageFile(file.path)}
                      className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded"
                      title="Unstage"
                    >
                      Staged
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStageFile(file.path)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      title="Stage"
                    >
                      Stage
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="flex-1 overflow-y-auto">
      {commitHistory.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-xs">No commits yet</div>
      ) : (
        <div className="p-2">
          {commitHistory.map(commit => (
            <div key={commit.hash} className="border-b p-2 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <GitCommit size={14} className="text-gray-600" />
                <span className="font-mono text-xs text-blue-600">{commit.hash}</span>
                <span className="text-xs text-gray-500">
                  {new Date(commit.date).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs mt-1">{commit.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                {commit.author} &lt;{commit.email}&gt;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBranchesTab = () => (
    <div className="flex-1 flex flex-col">
      <div className="p-2 border-b">
        <button
          onClick={handleCreateBranch}
          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          <Plus size={14} className="inline mr-1" />
          New Branch
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {branches.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">No branches found</div>
        ) : (
          <div className="p-2">
            {branches.map(branch => (
              <div
                key={branch.name}
                className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer ${
                  branch.current ? 'bg-blue-50' : ''
                }`}
                onClick={() => !branch.current && handleCheckoutBranch(branch.name)}
              >
                <GitBranch
                  size={14}
                  className={branch.current ? 'text-blue-600' : 'text-gray-600'}
                />
                <span className="text-xs flex-1">{branch.name}</span>
                {branch.current && <Check size={14} className="text-green-600" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-400 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-1 flex items-center justify-between">
        <span className="text-xs font-bold flex items-center gap-1">
          <GitFork size={14} />
          Git Integration
        </span>
        <div className="flex gap-1">
          <button onClick={handlePull} className="p-1 hover:bg-blue-700 rounded" title="Pull">
            <Download size={14} />
          </button>
          <button onClick={handlePush} className="p-1 hover:bg-blue-700 rounded" title="Push">
            <Upload size={14} />
          </button>
          <button onClick={loadGitData} className="p-1 hover:bg-blue-700 rounded" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Current branch indicator */}
      {gitStatus && (
        <div className="px-2 py-1 bg-gray-100 border-b text-xs flex items-center justify-between">
          <span className="flex items-center gap-1">
            <GitBranch size={12} />
            {gitStatus.branch}
          </span>
          {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
            <span className="text-gray-600">
              {gitStatus.ahead > 0 && `↑${gitStatus.ahead}`}
              {gitStatus.ahead > 0 && gitStatus.behind > 0 && ' '}
              {gitStatus.behind > 0 && `↓${gitStatus.behind}`}
            </span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-2 py-1 bg-red-100 text-red-700 text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-3 py-1 text-xs ${
            activeTab === 'changes' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-100'
          }`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
          {gitStatus &&
            gitStatus.staged.length + gitStatus.unstaged.length + gitStatus.untracked.length >
              0 && (
              <span className="ml-1 px-1 bg-blue-500 text-white rounded-full text-xs">
                {gitStatus.staged.length + gitStatus.unstaged.length + gitStatus.untracked.length}
              </span>
            )}
        </button>
        <button
          className={`px-3 py-1 text-xs ${
            activeTab === 'history' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-100'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`px-3 py-1 text-xs ${
            activeTab === 'branches' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-100'
          }`}
          onClick={() => setActiveTab('branches')}
        >
          Branches
        </button>
      </div>

      {/* Tab content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {activeTab === 'changes' && renderChangesTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'branches' && renderBranchesTab()}
        </>
      )}
    </div>
  );
};

export default GitPanel;
