import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';

interface TodoListProps {
  visible: boolean;
  onClose: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({ visible, onClose }) => {
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { todoItems, addTodo, toggleTodo, deleteTodo } = useVB6Store(
    state => ({
      todoItems: state.todoItems,
      addTodo: state.addTodo,
      toggleTodo: state.toggleTodo,
      deleteTodo: state.deleteTodo,
    }),
    shallow
  );
  const [text, setText] = useState('');

  if (!visible) return null;

  const handleAdd = () => {
    if (text.trim()) {
      addTodo(text.trim());
      setText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg w-96">
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Todo List</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="New task..."
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="max-h-60 overflow-auto">
            {todoItems.length > 0 ? (
              <ul className="space-y-1">
                {todoItems.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 text-sm bg-white px-2 py-1 border border-gray-300"
                  >
                    <button onClick={() => toggleTodo(item.id)} className="p-1">
                      {item.completed ? (
                        <CheckSquare size={16} className="text-green-600" />
                      ) : (
                        <Square size={16} className="text-gray-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {item.text}
                    </span>
                    <button onClick={() => deleteTodo(item.id)} className="p-1 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-sm text-center">No tasks yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
