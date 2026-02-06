/**
 * Collaboration Cursors - Real-time cursor and selection visualization
 *
 * Features:
 * - Live cursor positions from all collaborators
 * - Selection ranges with user colors
 * - User name labels with smooth animations
 * - Viewport-aware positioning
 * - Performance optimized rendering
 */

import React, { useEffect, useState, useRef } from 'react';
import { CollaboratorInfo } from '../../services/VB6CollaborationEngine';

interface CollaborationCursorsProps {
  collaborators: CollaboratorInfo[];
  currentUserId: string;
  editorElement: HTMLElement | null;
  documentId: string;
}

interface CursorElement {
  id: string;
  position: { x: number; y: number };
  color: string;
  name: string;
  isVisible: boolean;
}

interface SelectionElement {
  id: string;
  bounds: DOMRect[];
  color: string;
  name: string;
}

const CollaborationCursors: React.FC<CollaborationCursorsProps> = ({
  collaborators,
  currentUserId,
  editorElement,
  documentId,
}) => {
  const [cursors, setCursors] = useState<CursorElement[]>([]);
  const [selections, setSelections] = useState<SelectionElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update cursor and selection positions
  useEffect(() => {
    if (!editorElement) return;

    const updatePositions = () => {
      const newCursors: CursorElement[] = [];
      const newSelections: SelectionElement[] = [];

      for (const collaborator of collaborators) {
        // Skip current user
        if (collaborator.id === currentUserId) continue;

        // Skip if not in current document
        if (
          collaborator.cursor?.documentId !== documentId &&
          collaborator.selection?.documentId !== documentId
        )
          continue;

        // Handle cursor
        if (collaborator.cursor && collaborator.cursor.documentId === documentId) {
          const position = getPositionFromLineColumn(
            collaborator.cursor.line,
            collaborator.cursor.column,
            editorElement
          );

          if (position) {
            newCursors.push({
              id: collaborator.id,
              position,
              color: collaborator.color,
              name: collaborator.name,
              isVisible: collaborator.isOnline,
            });
          }
        }

        // Handle selection
        if (collaborator.selection && collaborator.selection.documentId === documentId) {
          const bounds = getSelectionBounds(
            collaborator.selection.start.line,
            collaborator.selection.start.column,
            collaborator.selection.end.line,
            collaborator.selection.end.column,
            editorElement
          );

          if (bounds.length > 0) {
            newSelections.push({
              id: collaborator.id,
              bounds,
              color: collaborator.color,
              name: collaborator.name,
            });
          }
        }
      }

      setCursors(newCursors);
      setSelections(newSelections);
    };

    updatePositions();

    // Update positions on scroll or resize
    const handleUpdate = () => updatePositions();

    editorElement.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    // Update positions periodically for Monaco editor changes
    const interval = setInterval(updatePositions, 100);

    return () => {
      editorElement.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(interval);
    };
  }, [collaborators, currentUserId, documentId, editorElement]);

  // Get position from line/column using Monaco editor API if available
  const getPositionFromLineColumn = (
    line: number,
    column: number,
    editor: HTMLElement
  ): { x: number; y: number } | null => {
    try {
      // Try to access Monaco editor instance
      const monacoEditor = (editor as any)?._monacoEditor;

      if (monacoEditor && monacoEditor.getScrolledVisiblePosition) {
        const position = monacoEditor.getScrolledVisiblePosition({
          lineNumber: line + 1, // Monaco uses 1-based line numbers
          column: column + 1,
        });

        if (position) {
          const editorRect = editor.getBoundingClientRect();
          return {
            x: position.left - editorRect.left,
            y: position.top - editorRect.top,
          };
        }
      }

      // Fallback: estimate position based on font metrics
      const lineHeight = 18; // Approximate line height
      const charWidth = 7.2; // Approximate character width

      const editorRect = editor.getBoundingClientRect();
      const scrollTop = editor.scrollTop || 0;
      const scrollLeft = editor.scrollLeft || 0;

      return {
        x: column * charWidth - scrollLeft,
        y: line * lineHeight - scrollTop,
      };
    } catch (error) {
      console.warn('Failed to get cursor position:', error);
      return null;
    }
  };

  // Get selection bounds for rendering selection highlights
  const getSelectionBounds = (
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
    editor: HTMLElement
  ): DOMRect[] => {
    try {
      const bounds: DOMRect[] = [];
      const lineHeight = 18;
      const charWidth = 7.2;

      const editorRect = editor.getBoundingClientRect();
      const scrollTop = editor.scrollTop || 0;
      const scrollLeft = editor.scrollLeft || 0;

      if (startLine === endLine) {
        // Single line selection
        const x = startColumn * charWidth - scrollLeft;
        const y = startLine * lineHeight - scrollTop;
        const width = (endColumn - startColumn) * charWidth;

        bounds.push(new DOMRect(x, y, width, lineHeight));
      } else {
        // Multi-line selection
        // First line
        const firstLineX = startColumn * charWidth - scrollLeft;
        const firstLineY = startLine * lineHeight - scrollTop;
        const firstLineWidth = (100 - startColumn) * charWidth; // Estimate to end of line

        bounds.push(new DOMRect(firstLineX, firstLineY, firstLineWidth, lineHeight));

        // Middle lines
        for (let line = startLine + 1; line < endLine; line++) {
          const lineY = line * lineHeight - scrollTop;
          bounds.push(new DOMRect(-scrollLeft, lineY, 1000, lineHeight)); // Full line width
        }

        // Last line
        const lastLineX = -scrollLeft;
        const lastLineY = endLine * lineHeight - scrollTop;
        const lastLineWidth = endColumn * charWidth;

        bounds.push(new DOMRect(lastLineX, lastLineY, lastLineWidth, lineHeight));
      }

      return bounds;
    } catch (error) {
      console.warn('Failed to get selection bounds:', error);
      return [];
    }
  };

  if (!editorElement) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ overflow: 'hidden' }}
    >
      {/* Selection highlights */}
      {selections.map(selection =>
        selection.bounds.map((bound, index) => (
          <div
            key={`${selection.id}-selection-${index}`}
            className="absolute opacity-20 rounded-sm"
            style={{
              left: bound.x,
              top: bound.y,
              width: bound.width,
              height: bound.height,
              backgroundColor: selection.color,
              pointerEvents: 'none',
              transition: 'all 0.1s ease-out',
            }}
          />
        ))
      )}

      {/* Cursors */}
      {cursors
        .filter(cursor => cursor.isVisible)
        .map(cursor => (
          <div
            key={`${cursor.id}-cursor`}
            className="absolute"
            style={{
              left: cursor.position.x,
              top: cursor.position.y,
              pointerEvents: 'none',
              transition: 'all 0.1s ease-out',
              zIndex: 1000,
            }}
          >
            {/* Cursor line */}
            <div
              className="absolute w-0.5 h-5 animate-pulse"
              style={{
                backgroundColor: cursor.color,
                boxShadow: `0 0 4px ${cursor.color}40`,
              }}
            />

            {/* User name label */}
            <div
              className="absolute top-0 left-1 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap opacity-90 transform -translate-y-full"
              style={{
                backgroundColor: cursor.color,
                fontSize: '11px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cursor.name}
            </div>

            {/* Cursor pointer triangle */}
            <div
              className="absolute top-0 left-0 w-0 h-0"
              style={{
                borderLeft: `4px solid ${cursor.color}`,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                transform: 'translateX(-2px)',
              }}
            />
          </div>
        ))}

      {/* Selection name labels */}
      {selections.map(selection => {
        const firstBound = selection.bounds[0];
        if (!firstBound) return null;

        return (
          <div
            key={`${selection.id}-label`}
            className="absolute px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap opacity-90"
            style={{
              left: firstBound.x,
              top: firstBound.y - 24,
              backgroundColor: selection.color,
              fontSize: '11px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
              transition: 'all 0.1s ease-out',
            }}
          >
            {selection.name} selected
          </div>
        );
      })}
    </div>
  );
};

export default CollaborationCursors;
