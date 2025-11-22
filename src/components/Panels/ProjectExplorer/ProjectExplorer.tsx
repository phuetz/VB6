import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Star, StarOff } from 'lucide-react';
import { useVB6 } from '../../../context/VB6Context';

const ProjectExplorer: React.FC = () => {
  const { state, dispatch } = useVB6();
  const [favoriteDirectories, setFavoriteDirectories] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Charger les favoris depuis localStorage au démarrage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('vb6-favorite-directories');
    if (savedFavorites) {
      setFavoriteDirectories(JSON.parse(savedFavorites));
    }
    
    // Simuler le chemin actuel du projet (dans un vrai projet, cela viendrait du système de fichiers)
    const projectPath = `C:\\Projects\\${state.projectName}`;
    setCurrentPath(projectPath);
  }, [state.projectName]);

  // Sauvegarder les favoris dans localStorage
  const saveFavorites = (favorites: string[]) => {
    setFavoriteDirectories(favorites);
    localStorage.setItem('vb6-favorite-directories', JSON.stringify(favorites));
  };

  // Ajouter/retirer un répertoire des favoris
  const toggleFavorite = (path: string) => {
    const isFavorite = favoriteDirectories.includes(path);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favoriteDirectories.filter(fav => fav !== path);
    } else {
      newFavorites = [...favoriteDirectories, path];
    }
    
    saveFavorites(newFavorites);
  };

  const isCurrentPathFavorite = favoriteDirectories.includes(currentPath);

  return (
    <div className="flex-1 border-b border-gray-400 flex flex-col max-h-64">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Project - {state.projectName}</span>
        <button
          onClick={() =>
            dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showProjectExplorer' } })
          }
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>

      <div className="flex-1 p-2 text-xs overflow-y-auto">
        <div className="flex items-center justify-between group">
          <div className="flex items-center flex-1">
            <ChevronDown size={12} />
            <span className="ml-1 font-bold">
              {state.projectName} ({state.projectName})
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentPath);
            }}
            className={`ml-2 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-gray-200 ${
              isCurrentPathFavorite ? 'opacity-100' : ''
            }`}
            title={isCurrentPathFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isCurrentPathFavorite ? (
              <Star size={14} className="text-yellow-500 fill-current" />
            ) : (
              <StarOff size={14} className="text-gray-400 hover:text-yellow-500" />
            )}
          </button>
        </div>

        <div className="ml-4 mt-1">
          <div className="flex items-center">
            <ChevronDown size={12} />
            <span className="ml-1">Forms</span>
          </div>

          <div className="ml-4">
            {state.forms.map(form => (
              <div
                key={form.id}
                className={`flex items-center cursor-pointer hover:bg-gray-200 px-1 ${
                  form.id === state.activeFormId ? 'bg-blue-100' : ''
                }`}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_FORM', payload: { id: form.id } });
                }}
              >
                <FileText size={12} />
                <span className="ml-1">
                  {form.name} ({form.name})
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-2">
            <ChevronDown size={12} />
            <span className="ml-1">Modules</span>
          </div>

          <div className="ml-4">
            {state.modules.map((module: any) => (
              <div
                key={module.id}
                className="flex items-center cursor-pointer hover:bg-gray-200 px-1"
                onDoubleClick={() => {
                  dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCodeEditor' } });
                }}
              >
                <FileText size={12} />
                <span className="ml-1">
                  {module.name} ({module.name})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Répertoires Favoris */}
        {favoriteDirectories.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="flex items-center mb-1">
              <ChevronDown size={12} />
              <span className="ml-1 font-bold flex items-center">
                <Star size={12} className="text-yellow-500 mr-1" />
                Favoris
              </span>
            </div>
            <div className="ml-4">
              {favoriteDirectories.map((favPath, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between group cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded"
                  title={favPath}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Star size={10} className="text-yellow-500 flex-shrink-0" />
                    <span className="ml-1 truncate text-xs">
                      {favPath.split('\\').pop() || favPath}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(favPath);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-gray-300 rounded"
                    title="Retirer des favoris"
                  >
                    <StarOff size={10} className="text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-300">
          <button
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded w-full text-left"
            onClick={() => {
              const formName = prompt('Form name:', `Form${state.forms.length + 1}`);
              if (formName) {
                dispatch({ type: 'ADD_FORM', payload: { name: formName } });
              }
            }}
          >
            + Add Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
