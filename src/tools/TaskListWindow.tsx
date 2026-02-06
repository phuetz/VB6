import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Task List Types
export enum TaskType {
  TODO = 'TODO',
  FIXME = 'FIXME',
  HACK = 'HACK',
  BUG = 'BUG',
  NOTE = 'NOTE',
  REVIEW = 'REVIEW',
  OPTIMIZE = 'OPTIMIZE',
  Error = 'Error',
  Warning = 'Warning',
  Custom = 'Custom',
}

export enum TaskPriority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum TaskStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  OnHold = 'OnHold',
}

export enum TaskCategory {
  Code = 'Code',
  Design = 'Design',
  Documentation = 'Documentation',
  Testing = 'Testing',
  Performance = 'Performance',
  Security = 'Security',
  UI = 'UI',
  Database = 'Database',
}

export interface TaskItem {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  title: string;
  description: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  assignedTo?: string;
  createdBy: string;
  createdDate: Date;
  modifiedDate: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  relatedFiles: string[];
  comments: Array<{
    id: string;
    author: string;
    date: Date;
    comment: string;
  }>;
  canEdit: boolean;
  canDelete: boolean;
  isBookmarked: boolean;
}

export interface TaskSettings {
  showCompleted: boolean;
  showCancelled: boolean;
  groupByFile: boolean;
  groupByCategory: boolean;
  sortBy: 'priority' | 'dueDate' | 'createdDate' | 'fileName' | 'type';
  sortOrder: 'asc' | 'desc';
  autoScan: boolean;
  scanInterval: number;
  includeComments: boolean;
  includeStrings: boolean;
  customKeywords: string[];
  fontSize: number;
  showLineNumbers: boolean;
  showCategories: boolean;
  showAssignee: boolean;
  showDueDates: boolean;
}

interface TaskListWindowProps {
  projectFiles?: string[];
  currentUser?: string;
  onNavigateToTask?: (task: TaskItem) => void;
  onUpdateTask?: (task: TaskItem) => Promise<boolean>;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  onCreateTask?: (task: Partial<TaskItem>) => Promise<TaskItem>;
  onScanFiles?: () => Promise<TaskItem[]>;
  onExportTasks?: (tasks: TaskItem[], format: 'CSV' | 'XML' | 'HTML') => void;
}

export const TaskListWindow: React.FC<TaskListWindowProps> = ({
  projectFiles = [],
  currentUser = 'Developer',
  onNavigateToTask,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  onScanFiles,
  onExportTasks,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [filterAssignee, setFilterAssignee] = useState<string | 'All'>('All');
  const [settings, setSettings] = useState<TaskSettings>({
    showCompleted: false,
    showCancelled: false,
    groupByFile: false,
    groupByCategory: false,
    sortBy: 'priority',
    sortOrder: 'desc',
    autoScan: true,
    scanInterval: 30000,
    includeComments: true,
    includeStrings: false,
    customKeywords: ['REFACTOR', 'CLEANUP'],
    fontSize: 11,
    showLineNumbers: true,
    showCategories: true,
    showAssignee: true,
    showDueDates: true,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTask, setNewTask] = useState<Partial<TaskItem>>({
    type: TaskType.TODO,
    priority: TaskPriority.Medium,
    status: TaskStatus.Open,
    category: TaskCategory.Code,
    title: '',
    description: '',
    assignedTo: currentUser,
    dueDate: undefined,
    tags: [],
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const eventEmitter = useRef(new EventEmitter());
  const scanTimer = useRef<NodeJS.Timeout>();

  // Initialize with sample tasks
  useEffect(() => {
    const sampleTasks: TaskItem[] = [
      {
        id: 'task1',
        type: TaskType.TODO,
        priority: TaskPriority.High,
        status: TaskStatus.Open,
        category: TaskCategory.Code,
        title: 'Implement error handling',
        description: 'Add proper error handling for database operations',
        fileName: 'DataModule.bas',
        lineNumber: 45,
        columnNumber: 8,
        assignedTo: 'John Doe',
        createdBy: currentUser,
        createdDate: new Date(Date.now() - 86400000),
        modifiedDate: new Date(Date.now() - 86400000),
        dueDate: new Date(Date.now() + 7 * 86400000),
        estimatedHours: 4,
        tags: ['error-handling', 'database'],
        relatedFiles: ['DataModule.bas', 'ErrorHandler.bas'],
        comments: [
          {
            id: 'comment1',
            author: currentUser,
            date: new Date(Date.now() - 86400000),
            comment: 'Need to handle SQL exceptions properly',
          },
        ],
        canEdit: true,
        canDelete: true,
        isBookmarked: false,
      },
      {
        id: 'task2',
        type: TaskType.FIXME,
        priority: TaskPriority.Critical,
        status: TaskStatus.InProgress,
        category: TaskCategory.Code,
        title: 'Memory leak in loop',
        description: 'Fix memory leak caused by not releasing COM objects',
        fileName: 'Form1.frm',
        lineNumber: 128,
        assignedTo: currentUser,
        createdBy: 'Jane Smith',
        createdDate: new Date(Date.now() - 2 * 86400000),
        modifiedDate: new Date(Date.now() - 3600000),
        dueDate: new Date(Date.now() + 86400000),
        estimatedHours: 2,
        actualHours: 1.5,
        tags: ['memory-leak', 'performance'],
        relatedFiles: ['Form1.frm'],
        comments: [],
        canEdit: true,
        canDelete: true,
        isBookmarked: true,
      },
      {
        id: 'task3',
        type: TaskType.BUG,
        priority: TaskPriority.Medium,
        status: TaskStatus.Open,
        category: TaskCategory.UI,
        title: 'Button not responding to click',
        description: 'Command button sometimes does not respond to mouse clicks',
        fileName: 'MainForm.frm',
        lineNumber: 67,
        assignedTo: 'Bob Wilson',
        createdBy: 'User Reports',
        createdDate: new Date(Date.now() - 3 * 86400000),
        modifiedDate: new Date(Date.now() - 3 * 86400000),
        estimatedHours: 3,
        tags: ['ui', 'user-interaction'],
        relatedFiles: ['MainForm.frm', 'CommonControls.bas'],
        comments: [
          {
            id: 'comment2',
            author: 'Bob Wilson',
            date: new Date(Date.now() - 2 * 86400000),
            comment: 'Might be related to focus issues',
          },
        ],
        canEdit: true,
        canDelete: true,
        isBookmarked: false,
      },
      {
        id: 'task4',
        type: TaskType.OPTIMIZE,
        priority: TaskPriority.Low,
        status: TaskStatus.Completed,
        category: TaskCategory.Performance,
        title: 'Optimize database query',
        description: 'Replace sequential search with indexed lookup',
        fileName: 'QueryModule.bas',
        lineNumber: 89,
        assignedTo: currentUser,
        createdBy: currentUser,
        createdDate: new Date(Date.now() - 5 * 86400000),
        modifiedDate: new Date(Date.now() - 86400000),
        estimatedHours: 6,
        actualHours: 4,
        tags: ['performance', 'database', 'optimization'],
        relatedFiles: ['QueryModule.bas', 'DatabaseUtils.bas'],
        comments: [
          {
            id: 'comment3',
            author: currentUser,
            date: new Date(Date.now() - 86400000),
            comment: 'Completed optimization, performance improved by 60%',
          },
        ],
        canEdit: true,
        canDelete: true,
        isBookmarked: false,
      },
      {
        id: 'task5',
        type: TaskType.REVIEW,
        priority: TaskPriority.Medium,
        status: TaskStatus.Open,
        category: TaskCategory.Code,
        title: 'Code review needed',
        description: 'New authentication module needs peer review',
        fileName: 'AuthModule.bas',
        lineNumber: 1,
        assignedTo: 'Senior Dev',
        createdBy: currentUser,
        createdDate: new Date(Date.now() - 86400000),
        modifiedDate: new Date(Date.now() - 86400000),
        dueDate: new Date(Date.now() + 3 * 86400000),
        estimatedHours: 2,
        tags: ['code-review', 'security'],
        relatedFiles: ['AuthModule.bas', 'CryptoUtils.bas'],
        comments: [],
        canEdit: true,
        canDelete: true,
        isBookmarked: false,
      },
    ];

    setTasks(sampleTasks);
  }, [currentUser]);

  // Auto-scan timer
  useEffect(() => {
    if (settings.autoScan) {
      scanTimer.current = setInterval(() => {
        scanForTasks();
      }, settings.scanInterval);
    }

    return () => {
      if (scanTimer.current) {
        clearInterval(scanTimer.current);
      }
    };
  }, [settings.autoScan, settings.scanInterval]);

  // Scan for tasks in project files
  const scanForTasks = useCallback(async () => {
    setIsScanning(true);
    try {
      if (onScanFiles) {
        const scannedTasks = await onScanFiles();
        // Merge with existing tasks, avoiding duplicates
        setTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = scannedTasks.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTasks];
        });
      } else {
        // Simulate scanning for demo
        setTimeout(() => {
          // Add a simulated new task
          if (Math.random() < 0.3) {
            const newTask: TaskItem = {
              id: `scanned_${Date.now()}`,
              type: TaskType.TODO,
              priority: TaskPriority.Medium,
              status: TaskStatus.Open,
              category: TaskCategory.Code,
              title: 'Scanned TODO comment',
              description: 'TODO: Add validation for user input',
              fileName: 'NewModule.bas',
              lineNumber: Math.floor(Math.random() * 100) + 1,
              assignedTo: currentUser,
              createdBy: 'Auto-scan',
              createdDate: new Date(),
              modifiedDate: new Date(),
              tags: ['auto-generated'],
              relatedFiles: ['NewModule.bas'],
              comments: [],
              canEdit: true,
              canDelete: true,
              isBookmarked: false,
            };
            setTasks(prev => [...prev, newTask]);
          }
        }, 1000);
      }
    } finally {
      setIsScanning(false);
    }
  }, [onScanFiles, currentUser]);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      // Apply status filters
      if (!settings.showCompleted && task.status === TaskStatus.Completed) return false;
      if (!settings.showCancelled && task.status === TaskStatus.Cancelled) return false;

      // Apply type filter
      if (filterType !== 'All' && task.type !== filterType) return false;

      // Apply priority filter
      if (filterPriority !== 'All' && task.priority !== filterPriority) return false;

      // Apply status filter
      if (filterStatus !== 'All' && task.status !== filterStatus) return false;

      // Apply assignee filter
      if (filterAssignee !== 'All' && task.assignedTo !== filterAssignee) return false;

      // Apply search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.fileName.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (settings.sortBy) {
        case 'priority': {
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        }
        case 'dueDate': {
          const aDate = a.dueDate?.getTime() || Infinity;
          const bDate = b.dueDate?.getTime() || Infinity;
          comparison = aDate - bDate;
          break;
        }
        case 'createdDate':
          comparison = b.createdDate.getTime() - a.createdDate.getTime();
          break;
        case 'fileName':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return settings.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [tasks, settings, filterType, filterPriority, filterStatus, filterAssignee, searchText]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (!settings.groupByFile && !settings.groupByCategory) {
      return { default: processedTasks };
    }

    const groupKey = settings.groupByFile ? 'fileName' : 'category';
    return processedTasks.reduce(
      (groups, task) => {
        const key = task[groupKey];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(task);
        return groups;
      },
      {} as Record<string, TaskItem[]>
    );
  }, [processedTasks, settings.groupByFile, settings.groupByCategory]);

  // Create new task
  const createTask = useCallback(async () => {
    if (!newTask.title?.trim()) return;

    try {
      const taskToCreate: Partial<TaskItem> = {
        ...newTask,
        id: `task_${Date.now()}`,
        createdBy: currentUser,
        createdDate: new Date(),
        modifiedDate: new Date(),
        tags: newTask.tags || [],
        relatedFiles: [],
        comments: [],
        canEdit: true,
        canDelete: true,
        isBookmarked: false,
      };

      if (onCreateTask) {
        const createdTask = await onCreateTask(taskToCreate);
        setTasks(prev => [...prev, createdTask]);
      } else {
        // Create locally for demo
        const localTask = taskToCreate as TaskItem;
        setTasks(prev => [...prev, localTask]);
      }

      setNewTask({
        type: TaskType.TODO,
        priority: TaskPriority.Medium,
        status: TaskStatus.Open,
        category: TaskCategory.Code,
        title: '',
        description: '',
        assignedTo: currentUser,
        tags: [],
      });
      setShowNewTaskDialog(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [newTask, currentUser, onCreateTask]);

  // Update task
  const updateTask = useCallback(
    async (task: TaskItem) => {
      try {
        if (onUpdateTask) {
          const success = await onUpdateTask(task);
          if (!success) return;
        }

        setTasks(prev =>
          prev.map(t => (t.id === task.id ? { ...task, modifiedDate: new Date() } : t))
        );
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    },
    [onUpdateTask]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        if (onDeleteTask) {
          const success = await onDeleteTask(taskId);
          if (!success) return;
        }

        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    },
    [onDeleteTask, selectedTask]
  );

  // Get task priority color
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.Critical:
        return 'text-red-600 bg-red-100';
      case TaskPriority.High:
        return 'text-orange-600 bg-orange-100';
      case TaskPriority.Medium:
        return 'text-yellow-600 bg-yellow-100';
      case TaskPriority.Low:
        return 'text-green-600 bg-green-100';
    }
  };

  // Get task type icon
  const getTaskTypeIcon = (type: TaskType): string => {
    switch (type) {
      case TaskType.TODO:
        return '📝';
      case TaskType.FIXME:
        return '🔧';
      case TaskType.HACK:
        return '⚡';
      case TaskType.BUG:
        return '🐛';
      case TaskType.NOTE:
        return '📄';
      case TaskType.REVIEW:
        return '👁️';
      case TaskType.OPTIMIZE:
        return '⚡';
      case TaskType.Error:
        return '❌';
      case TaskType.Warning:
        return '⚠️';
      default:
        return '📋';
    }
  };

  // Get task status color
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.Open:
        return 'text-blue-600';
      case TaskStatus.InProgress:
        return 'text-orange-600';
      case TaskStatus.Completed:
        return 'text-green-600';
      case TaskStatus.Cancelled:
        return 'text-red-600';
      case TaskStatus.OnHold:
        return 'text-gray-600';
    }
  };

  // Render task row
  const renderTask = (task: TaskItem): React.ReactNode => {
    const isSelected = selectedTask?.id === task.id;
    const isOverdue =
      task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.Completed;

    return (
      <div
        key={task.id}
        className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
          isSelected ? 'bg-blue-100' : ''
        } ${isOverdue ? 'bg-red-50' : ''}`}
        style={{ fontSize: `${settings.fontSize}px` }}
        onClick={() => {
          setSelectedTask(task);
          onNavigateToTask?.(task);
        }}
      >
        {/* Bookmark */}
        <button
          onClick={e => {
            e.stopPropagation();
            updateTask({ ...task, isBookmarked: !task.isBookmarked });
          }}
          className="w-4 text-center"
        >
          {task.isBookmarked ? '⭐' : '☆'}
        </button>

        {/* Type Icon */}
        <span className="w-6 text-center">{getTaskTypeIcon(task.type)}</span>

        {/* Priority */}
        <div
          className={`w-16 text-xs px-1 py-0.5 rounded text-center ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </div>

        {/* Title */}
        <div className="w-64 font-medium text-gray-800 truncate">{task.title}</div>

        {/* File and Line */}
        <div className="w-32 text-sm text-gray-600 truncate">
          {task.fileName}
          {settings.showLineNumbers && <span className="text-gray-400">:{task.lineNumber}</span>}
        </div>

        {/* Category */}
        {settings.showCategories && (
          <div className="w-24 text-xs text-gray-500 truncate">{task.category}</div>
        )}

        {/* Assignee */}
        {settings.showAssignee && (
          <div className="w-24 text-sm text-gray-600 truncate">{task.assignedTo}</div>
        )}

        {/* Status */}
        <div className={`w-20 text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </div>

        {/* Due Date */}
        {settings.showDueDates && (
          <div
            className={`w-20 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}
          >
            {task.dueDate ? task.dueDate.toLocaleDateString() : '-'}
          </div>
        )}

        {/* Progress */}
        {task.estimatedHours && task.actualHours && (
          <div className="w-16 text-xs text-gray-500">
            {Math.round((task.actualHours / task.estimatedHours) * 100)}%
          </div>
        )}

        {/* Actions */}
        <div className="w-16 flex gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              // Toggle status between Open and Completed
              const newStatus =
                task.status === TaskStatus.Completed ? TaskStatus.Open : TaskStatus.Completed;
              updateTask({ ...task, status: newStatus });
            }}
            className={`text-xs px-1 py-0.5 rounded ${
              task.status === TaskStatus.Completed
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            title={task.status === TaskStatus.Completed ? 'Reopen' : 'Complete'}
          >
            ✓
          </button>

          {task.canDelete && (
            <button
              onClick={e => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              className="text-xs text-red-600 hover:text-red-800"
              title="Delete"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  // Get unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(tasks.map(t => t.assignedTo).filter(Boolean));
    return Array.from(assignees);
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Task List</h3>
          {isScanning && <div className="text-xs text-blue-600 animate-pulse">Scanning...</div>}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
          />

          <button
            onClick={() => setShowNewTaskDialog(true)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="New Task"
          >
            ➕
          </button>

          <button
            onClick={scanForTasks}
            disabled={isScanning}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            title="Scan Files"
          >
            🔍
          </button>

          <button
            onClick={() => onExportTasks?.(processedTasks, 'CSV')}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Export"
          >
            📊
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200 text-xs">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as TaskType | 'All')}
          className="px-2 py-1 border border-gray-300 rounded"
        >
          <option value="All">All Types</option>
          {Object.values(TaskType).map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as TaskPriority | 'All')}
          className="px-2 py-1 border border-gray-300 rounded"
        >
          <option value="All">All Priorities</option>
          {Object.values(TaskPriority).map(priority => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as TaskStatus | 'All')}
          className="px-2 py-1 border border-gray-300 rounded"
        >
          <option value="All">All Status</option>
          {Object.values(TaskStatus).map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded"
        >
          <option value="All">All Assignees</option>
          {uniqueAssignees.map(assignee => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>

        <div className="flex gap-2 ml-4">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.showCompleted}
              onChange={e => setSettings(prev => ({ ...prev, showCompleted: e.target.checked }))}
            />
            Completed
          </label>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.groupByFile}
              onChange={e => setSettings(prev => ({ ...prev, groupByFile: e.target.checked }))}
            />
            Group by File
          </label>
        </div>
      </div>

      {/* Column Headers */}
      <div
        className="flex items-center py-2 px-2 bg-gray-200 border-b border-gray-300 text-xs font-medium text-gray-700"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="w-4"></div>
        <div className="w-6"></div>
        <div className="w-16">Priority</div>
        <div className="w-64">Title</div>
        <div className="w-32">File</div>
        {settings.showCategories && <div className="w-24">Category</div>}
        {settings.showAssignee && <div className="w-24">Assignee</div>}
        <div className="w-20">Status</div>
        {settings.showDueDates && <div className="w-20">Due Date</div>}
        <div className="w-16">Actions</div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedTasks).length > 0 ? (
          settings.groupByFile || settings.groupByCategory ? (
            Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 py-2 px-2 bg-gray-100 border-b border-gray-200 text-sm font-medium">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedGroups);
                      if (newExpanded.has(groupName)) {
                        newExpanded.delete(groupName);
                      } else {
                        newExpanded.add(groupName);
                      }
                      setExpandedGroups(newExpanded);
                    }}
                    className="text-gray-600"
                  >
                    {expandedGroups.has(groupName) ? '▼' : '▶'}
                  </button>
                  <span>{groupName}</span>
                  <span className="text-xs text-gray-500">({groupTasks.length})</span>
                </div>
                {expandedGroups.has(groupName) && groupTasks.map(task => renderTask(task))}
              </div>
            ))
          ) : (
            processedTasks.map(task => renderTask(task))
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg">No tasks found</p>
              <p className="text-sm mt-2">
                Create a new task or scan project files for TODO comments
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Task Dialog */}
      {showNewTaskDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Create New Task</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title || ''}
                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />

              <textarea
                placeholder="Description"
                value={newTask.description || ''}
                onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded h-20"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTask.type}
                  onChange={e =>
                    setNewTask(prev => ({ ...prev, type: e.target.value as TaskType }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(TaskType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={newTask.priority}
                  onChange={e =>
                    setNewTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(TaskPriority).map(priority => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                value={newTask.dueDate ? newTask.dueDate.toISOString().split('T')[0] : ''}
                onChange={e =>
                  setNewTask(prev => ({
                    ...prev,
                    dueDate: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewTaskDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.title?.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Tasks: {processedTasks.length}/{tasks.length}
          </span>
          <span>Open: {processedTasks.filter(t => t.status === TaskStatus.Open).length}</span>
          <span>
            In Progress: {processedTasks.filter(t => t.status === TaskStatus.InProgress).length}
          </span>
          <span>
            Completed: {processedTasks.filter(t => t.status === TaskStatus.Completed).length}
          </span>
          <span>
            Overdue:{' '}
            {
              processedTasks.filter(
                t => t.dueDate && t.dueDate < new Date() && t.status !== TaskStatus.Completed
              ).length
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {settings.autoScan && <span className="text-green-600">Auto-scan enabled</span>}
          <span>User: {currentUser}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskListWindow;
