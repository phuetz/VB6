import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Import Project Explorer components
import ProjectExplorer from '../../components/Panels/ProjectExplorer/ProjectExplorer';

// Mock stores and contexts
vi.mock('../../stores/vb6Store');
vi.mock('../../context/VB6Context');

describe('Project Explorer Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockProject: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockProject = {
      name: 'TestProject',
      forms: [
        { name: 'Form1', path: 'Form1.frm', type: 'form' },
        { name: 'Form2', path: 'Form2.frm', type: 'form' }
      ],
      modules: [
        { name: 'Module1', path: 'Module1.bas', type: 'module' },
        { name: 'Module2', path: 'Module2.bas', type: 'module' }
      ],
      classes: [
        { name: 'Class1', path: 'Class1.cls', type: 'class' }
      ],
      references: [
        { name: 'Microsoft ActiveX Data Objects 2.8', path: 'msado15.dll' },
        { name: 'Microsoft Scripting Runtime', path: 'scrrun.dll' }
      ]
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Project Tree Structure', () => {
    it('should render project tree with all nodes', () => {
      render(<ProjectExplorer project={mockProject} />);
      
      expect(screen.getByText('TestProject')).toBeInTheDocument();
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Class Modules')).toBeInTheDocument();
      expect(screen.getByText('References')).toBeInTheDocument();
    });

    it('should expand and collapse nodes', async () => {
      render(<ProjectExplorer project={mockProject} />);
      
      const formsNode = screen.getByText('Forms');
      
      // Initially collapsed
      expect(screen.queryByText('Form1')).not.toBeInTheDocument();
      
      // Expand forms
      await user.click(formsNode);
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.getByText('Form2')).toBeInTheDocument();
      
      // Collapse forms
      await user.click(formsNode);
      expect(screen.queryByText('Form1')).not.toBeInTheDocument();
    });

    it('should show correct icons for different file types', () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1').closest('.tree-item');
      const module1 = screen.getByText('Module1').closest('.tree-item');
      const class1 = screen.getByText('Class1').closest('.tree-item');
      
      expect(within(form1!).getByTestId('form-icon')).toBeInTheDocument();
      expect(within(module1!).getByTestId('module-icon')).toBeInTheDocument();
      expect(within(class1!).getByTestId('class-icon')).toBeInTheDocument();
    });

    it('should display file paths in tooltips', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1');
      await user.hover(form1);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Form1.frm');
      });
    });

    it('should handle empty project sections', () => {
      const emptyProject = {
        name: 'EmptyProject',
        forms: [],
        modules: [],
        classes: [],
        references: []
      };
      
      render(<ProjectExplorer project={emptyProject} expanded />);
      
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('(Empty)')).toBeInTheDocument();
    });
  });

  describe('File Operations', () => {
    it('should select files on click', async () => {
      const onSelectFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onSelectFile={onSelectFile} expanded />);
      
      const form1 = screen.getByText('Form1');
      await user.click(form1);
      
      expect(onSelectFile).toHaveBeenCalledWith({
        name: 'Form1',
        path: 'Form1.frm',
        type: 'form'
      });
      
      expect(form1.closest('.tree-item')).toHaveClass('selected');
    });

    it('should open files on double click', async () => {
      const onOpenFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onOpenFile={onOpenFile} expanded />);
      
      const module1 = screen.getByText('Module1');
      await user.dblClick(module1);
      
      expect(onOpenFile).toHaveBeenCalledWith({
        name: 'Module1',
        path: 'Module1.bas',
        type: 'module'
      });
    });

    it('should show context menu on right click', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1');
      fireEvent.contextMenu(form1);
      
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });

    it('should handle file renaming', async () => {
      const onRenameFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onRenameFile={onRenameFile} expanded />);
      
      const form1 = screen.getByText('Form1');
      fireEvent.contextMenu(form1);
      
      await user.click(screen.getByText('Rename'));
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Form1');
      
      await user.clear(input);
      await user.type(input, 'MainForm');
      await user.keyboard('{Enter}');
      
      expect(onRenameFile).toHaveBeenCalledWith('Form1', 'MainForm');
    });

    it('should handle file removal', async () => {
      const onRemoveFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onRemoveFile={onRemoveFile} expanded />);
      
      const module1 = screen.getByText('Module1');
      fireEvent.contextMenu(module1);
      
      await user.click(screen.getByText('Remove'));
      
      // Confirmation dialog
      expect(screen.getByText('Remove Module1?')).toBeInTheDocument();
      await user.click(screen.getByText('Yes'));
      
      expect(onRemoveFile).toHaveBeenCalledWith({
        name: 'Module1',
        path: 'Module1.bas',
        type: 'module'
      });
    });

    it('should add new files', async () => {
      const onAddFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onAddFile={onAddFile} />);
      
      const formsSection = screen.getByText('Forms');
      fireEvent.contextMenu(formsSection);
      
      await user.click(screen.getByText('Add Form'));
      
      expect(screen.getByText('New Form')).toBeInTheDocument();
      
      const nameInput = screen.getByLabelText('Form Name');
      await user.type(nameInput, 'NewForm');
      
      await user.click(screen.getByText('Create'));
      
      expect(onAddFile).toHaveBeenCalledWith({
        type: 'form',
        name: 'NewForm',
        template: 'standard'
      });
    });

    it('should handle drag and drop reordering', async () => {
      const onReorderFiles = vi.fn();
      render(<ProjectExplorer project={mockProject} onReorderFiles={onReorderFiles} expanded />);
      
      const form1 = screen.getByText('Form1');
      const form2 = screen.getByText('Form2');
      
      // Drag Form2 above Form1
      fireEvent.dragStart(form2);
      fireEvent.dragEnter(form1);
      fireEvent.drop(form1);
      
      expect(onReorderFiles).toHaveBeenCalledWith('forms', [
        { name: 'Form2', path: 'Form2.frm', type: 'form' },
        { name: 'Form1', path: 'Form1.frm', type: 'form' }
      ]);
    });
  });

  describe('Search and Filter', () => {
    it('should filter files by search term', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      await user.type(searchInput, 'Form1');
      
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.queryByText('Form2')).not.toBeInTheDocument();
      expect(screen.queryByText('Module1')).not.toBeInTheDocument();
    });

    it('should filter by file type', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const filterDropdown = screen.getByTestId('file-type-filter');
      await user.selectOptions(filterDropdown, 'form');
      
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.getByText('Form2')).toBeInTheDocument();
      expect(screen.queryByText('Module1')).not.toBeInTheDocument();
    });

    it('should clear search and filters', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      await user.type(searchInput, 'Form1');
      
      const clearButton = screen.getByTestId('clear-search');
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.getByText('Form2')).toBeInTheDocument();
      expect(screen.getByText('Module1')).toBeInTheDocument();
    });

    it('should show search results count', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      await user.type(searchInput, 'Form');
      
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });

    it('should support regex search', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      const regexToggle = screen.getByTestId('regex-search-toggle');
      
      await user.click(regexToggle);
      await user.type(searchInput, 'Form[12]');
      
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.getByText('Form2')).toBeInTheDocument();
      expect(screen.queryByText('Module1')).not.toBeInTheDocument();
    });
  });

  describe('File Status and Indicators', () => {
    it('should show modified file indicator', () => {
      const projectWithModified = {
        ...mockProject,
        forms: [
          { ...mockProject.forms[0], modified: true },
          mockProject.forms[1]
        ]
      };
      
      render(<ProjectExplorer project={projectWithModified} expanded />);
      
      const form1 = screen.getByText('Form1').closest('.tree-item');
      expect(within(form1!).getByTestId('modified-indicator')).toBeInTheDocument();
    });

    it('should show error indicators', () => {
      const projectWithErrors = {
        ...mockProject,
        modules: [
          { ...mockProject.modules[0], hasErrors: true, errorCount: 3 },
          mockProject.modules[1]
        ]
      };
      
      render(<ProjectExplorer project={projectWithErrors} expanded />);
      
      const module1 = screen.getByText('Module1').closest('.tree-item');
      const errorBadge = within(module1!).getByTestId('error-badge');
      
      expect(errorBadge).toBeInTheDocument();
      expect(errorBadge).toHaveTextContent('3');
    });

    it('should show version control status', () => {
      const projectWithVCS = {
        ...mockProject,
        forms: [
          { ...mockProject.forms[0], vcsStatus: 'modified' },
          { ...mockProject.forms[1], vcsStatus: 'added' }
        ]
      };
      
      render(<ProjectExplorer project={projectWithVCS} expanded />);
      
      const form1 = screen.getByText('Form1').closest('.tree-item');
      const form2 = screen.getByText('Form2').closest('.tree-item');
      
      expect(form1).toHaveClass('vcs-modified');
      expect(form2).toHaveClass('vcs-added');
    });

    it('should show file size information', async () => {
      const projectWithSizes = {
        ...mockProject,
        forms: [
          { ...mockProject.forms[0], size: 1024 },
          mockProject.forms[1]
        ]
      };
      
      render(<ProjectExplorer project={projectWithSizes} expanded />);
      
      const form1 = screen.getByText('Form1');
      await user.hover(form1);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('1 KB');
      });
    });

    it('should show last modified date', async () => {
      const projectWithDates = {
        ...mockProject,
        modules: [
          { 
            ...mockProject.modules[0], 
            lastModified: new Date('2024-01-15T10:30:00')
          }
        ]
      };
      
      render(<ProjectExplorer project={projectWithDates} expanded />);
      
      const module1 = screen.getByText('Module1');
      await user.hover(module1);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Modified: Jan 15, 2024');
      });
    });
  });

  describe('References Management', () => {
    it('should display project references', () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      expect(screen.getByText('Microsoft ActiveX Data Objects 2.8')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Scripting Runtime')).toBeInTheDocument();
    });

    it('should add new references', async () => {
      const onAddReference = vi.fn();
      render(<ProjectExplorer project={mockProject} onAddReference={onAddReference} />);
      
      const referencesSection = screen.getByText('References');
      fireEvent.contextMenu(referencesSection);
      
      await user.click(screen.getByText('Add Reference'));
      
      expect(screen.getByText('Browse References')).toBeInTheDocument();
      
      const referenceList = screen.getByTestId('available-references');
      const oleDbRef = within(referenceList).getByText('Microsoft OLE DB Service Component');
      
      await user.click(oleDbRef);
      await user.click(screen.getByText('OK'));
      
      expect(onAddReference).toHaveBeenCalledWith({
        name: 'Microsoft OLE DB Service Component',
        path: 'oledb32.dll',
        version: '1.0'
      });
    });

    it('should remove references', async () => {
      const onRemoveReference = vi.fn();
      render(<ProjectExplorer project={mockProject} onRemoveReference={onRemoveReference} expanded />);
      
      const reference = screen.getByText('Microsoft ActiveX Data Objects 2.8');
      fireEvent.contextMenu(reference);
      
      await user.click(screen.getByText('Remove Reference'));
      
      expect(onRemoveReference).toHaveBeenCalledWith({
        name: 'Microsoft ActiveX Data Objects 2.8',
        path: 'msado15.dll'
      });
    });

    it('should show reference properties', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const reference = screen.getByText('Microsoft ActiveX Data Objects 2.8');
      fireEvent.contextMenu(reference);
      
      await user.click(screen.getByText('Properties'));
      
      expect(screen.getByText('Reference Properties')).toBeInTheDocument();
      expect(screen.getByText('msado15.dll')).toBeInTheDocument();
    });

    it('should validate reference conflicts', async () => {
      const conflictingProject = {
        ...mockProject,
        references: [
          ...mockProject.references,
          { name: 'Microsoft ActiveX Data Objects 6.0', path: 'msado60.dll' }
        ]
      };
      
      render(<ProjectExplorer project={conflictingProject} expanded />);
      
      const conflictingRef = screen.getByText('Microsoft ActiveX Data Objects 6.0').closest('.tree-item');
      expect(within(conflictingRef!).getByTestId('conflict-warning')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1');
      form1.focus();
      
      // Move down to Form2
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Form2')).toHaveFocus();
      
      // Move up to Form1
      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('Form1')).toHaveFocus();
    });

    it('should expand/collapse with Enter and Space', async () => {
      render(<ProjectExplorer project={mockProject} />);
      
      const formsSection = screen.getByText('Forms');
      formsSection.focus();
      
      // Expand with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Form1')).toBeInTheDocument();
      
      // Collapse with Space
      await user.keyboard(' ');
      expect(screen.queryByText('Form1')).not.toBeInTheDocument();
    });

    it('should support keyboard shortcuts', async () => {
      const onDeleteFile = vi.fn();
      render(<ProjectExplorer project={mockProject} onDeleteFile={onDeleteFile} expanded />);
      
      const form1 = screen.getByText('Form1');
      form1.focus();
      
      // Delete with Delete key
      await user.keyboard('{Delete}');
      
      expect(screen.getByText('Delete Form1?')).toBeInTheDocument();
      await user.keyboard('{Enter}'); // Confirm
      
      expect(onDeleteFile).toHaveBeenCalled();
    });

    it('should support F2 for renaming', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const module1 = screen.getByText('Module1');
      module1.focus();
      
      await user.keyboard('{F2}');
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Module1');
      expect(input).toHaveFocus();
    });
  });

  describe('Multi-Selection', () => {
    it('should support multiple file selection', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1');
      const form2 = screen.getByText('Form2');
      
      await user.click(form1);
      await user.click(form2, { ctrlKey: true });
      
      expect(form1.closest('.tree-item')).toHaveClass('selected');
      expect(form2.closest('.tree-item')).toHaveClass('selected');
    });

    it('should support range selection', async () => {
      render(<ProjectExplorer project={mockProject} expanded />);
      
      const form1 = screen.getByText('Form1');
      const module2 = screen.getByText('Module2');
      
      await user.click(form1);
      await user.click(module2, { shiftKey: true });
      
      // All items between Form1 and Module2 should be selected
      expect(screen.getByText('Form1').closest('.tree-item')).toHaveClass('selected');
      expect(screen.getByText('Form2').closest('.tree-item')).toHaveClass('selected');
      expect(screen.getByText('Module1').closest('.tree-item')).toHaveClass('selected');
      expect(screen.getByText('Module2').closest('.tree-item')).toHaveClass('selected');
    });

    it('should perform bulk operations on selected files', async () => {
      const onBulkDelete = vi.fn();
      render(<ProjectExplorer project={mockProject} onBulkDelete={onBulkDelete} expanded />);
      
      const form1 = screen.getByText('Form1');
      const form2 = screen.getByText('Form2');
      
      await user.click(form1);
      await user.click(form2, { ctrlKey: true });
      
      await user.keyboard('{Delete}');
      
      expect(screen.getByText('Delete 2 selected files?')).toBeInTheDocument();
      await user.click(screen.getByText('Yes'));
      
      expect(onBulkDelete).toHaveBeenCalledWith([
        { name: 'Form1', path: 'Form1.frm', type: 'form' },
        { name: 'Form2', path: 'Form2.frm', type: 'form' }
      ]);
    });
  });

  describe('Persistence and State', () => {
    it('should remember expanded state', () => {
      localStorage.setItem('projectExplorer.expandedNodes', JSON.stringify(['Forms', 'Modules']));
      
      render(<ProjectExplorer project={mockProject} />);
      
      expect(screen.getByText('Form1')).toBeInTheDocument();
      expect(screen.getByText('Module1')).toBeInTheDocument();
    });

    it('should save expanded state on changes', async () => {
      render(<ProjectExplorer project={mockProject} />);
      
      const formsNode = screen.getByText('Forms');
      await user.click(formsNode);
      
      const saved = JSON.parse(localStorage.getItem('projectExplorer.expandedNodes') || '[]');
      expect(saved).toContain('Forms');
    });

    it('should remember selected file', () => {
      localStorage.setItem('projectExplorer.selectedFile', 'Form1');
      
      render(<ProjectExplorer project={mockProject} expanded />);
      
      expect(screen.getByText('Form1').closest('.tree-item')).toHaveClass('selected');
    });

    it('should save window size and position', async () => {
      render(<ProjectExplorer project={mockProject} resizable />);
      
      const resizer = screen.getByTestId('project-explorer-resizer');
      
      fireEvent.mouseDown(resizer, { clientX: 200 });
      fireEvent.mouseMove(window, { clientX: 300 });
      fireEvent.mouseUp(window);
      
      const saved = JSON.parse(localStorage.getItem('projectExplorer.size') || '{}');
      expect(saved.width).toBe(300);
    });
  });

  describe('Performance and Virtualization', () => {
    it('should handle large project trees efficiently', () => {
      const largeProject = {
        name: 'LargeProject',
        forms: Array.from({ length: 1000 }, (_, i) => ({
          name: `Form${i}`,
          path: `Form${i}.frm`,
          type: 'form'
        })),
        modules: [],
        classes: [],
        references: []
      };
      
      const { container } = render(<ProjectExplorer project={largeProject} expanded />);
      
      // Should use virtualization for large lists
      expect(container.querySelector('.virtual-list')).toBeInTheDocument();
      
      // Should only render visible items
      const renderedItems = screen.getAllByText(/Form\d+/);
      expect(renderedItems.length).toBeLessThan(50); // Only visible items
    });

    it('should lazy load file details', async () => {
      const mockLoadFileDetails = vi.fn();
      render(<ProjectExplorer project={mockProject} onLoadFileDetails={mockLoadFileDetails} expanded />);
      
      const form1 = screen.getByText('Form1');
      await user.hover(form1);
      
      await waitFor(() => {
        expect(mockLoadFileDetails).toHaveBeenCalledWith('Form1.frm');
      });
    });

    it('should debounce search input', async () => {
      const mockOnSearch = vi.fn();
      render(<ProjectExplorer project={mockProject} onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      
      await user.type(searchInput, 'Form');
      
      // Should not call immediately
      expect(mockOnSearch).not.toHaveBeenCalled();
      
      // Should call after debounce delay
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('Form');
      }, { timeout: 1000 });
    });
  });
});