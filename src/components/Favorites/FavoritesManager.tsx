// Gestionnaire des répertoires favoris
// Interface complète pour gérer les favoris avec toutes les fonctionnalités

import React, { useState } from 'react';
import { 
  Star, 
  StarOff, 
  Edit2, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FolderOpen, 
  Download, 
  Upload,
  BarChart3,
  Clock,
  X
} from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteDirectory } from '../../services/FavoritesService';

interface FavoritesManagerProps {
  visible: boolean;
  onClose: () => void;
  onSelectPath?: (path: string) => void;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  visible,
  onClose,
  onSelectPath
}) => {
  const {
    favorites,
    removeFavorite,
    renameFavorite,
    moveFavorite,
    markAsAccessed,
    getFavoritesByType,
    getRecentlyAccessed,
    cleanupFavorites,
    exportFavorites,
    importFavorites,
    getStats
  } = useFavorites();

  const [activeTab, setActiveTab] = useState<'all' | 'vb6' | 'recent' | 'stats'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  if (!visible) return null;

  const handleEdit = (favorite: FavoriteDirectory) => {
    setEditingId(favorite.id);
    setEditingName(favorite.name);
  };

  const saveEdit = (path: string) => {
    if (editingName.trim()) {
      renameFavorite(path, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSelectPath = (path: string) => {
    markAsAccessed(path);
    onSelectPath?.(path);
    onClose();
  };

  const handleExport = () => {
    const data = exportFavorites();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vb6-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          if (importFavorites(data)) {
            alert('Favoris importés avec succès !');
          } else {
            alert('Erreur lors de l\'importation des favoris.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const renderFavoritesList = (favoritesToShow: FavoriteDirectory[]) => (
    <div className="space-y-1">
      {favoritesToShow.map((favorite) => (
        <div
          key={favorite.id}
          className="group flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200"
        >
          <Star className="text-yellow-500 flex-shrink-0" size={16} />
          
          <div className="flex-1 min-w-0">
            {editingId === favorite.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') saveEdit(favorite.path);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(favorite.path)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                >
                  ✓
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div 
                  className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 truncate"
                  onClick={() => handleSelectPath(favorite.path)}
                  title={favorite.path}
                >
                  {favorite.name}
                </div>
                <div className="text-xs text-gray-500 truncate" title={favorite.path}>
                  {favorite.path}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>Ajouté: {favorite.dateAdded.toLocaleDateString()}</span>
                  {favorite.lastAccessed && (
                    <span>• Accédé: {favorite.lastAccessed.toLocaleDateString()}</span>
                  )}
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {favorite.projectType?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => moveFavorite(favorite.path, 'up')}
              className="p-1 hover:bg-gray-200 rounded"
              title="Déplacer vers le haut"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => moveFavorite(favorite.path, 'down')}
              className="p-1 hover:bg-gray-200 rounded"
              title="Déplacer vers le bas"
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={() => handleEdit(favorite)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Renommer"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => removeFavorite(favorite.path)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-2xl w-[700px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="text-yellow-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Gestionnaire des Favoris
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'all', label: 'Tous', count: favorites.length },
            { id: 'vb6', label: 'VB6', count: getFavoritesByType('vb6').length },
            { id: 'recent', label: 'Récents', count: getRecentlyAccessed().length },
            { id: 'stats', label: 'Statistiques', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'all' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Tous les favoris ({favorites.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const cleaned = cleanupFavorites();
                      if (cleaned > 0) {
                        alert(`${cleaned} favoris nettoyés !`);
                      } else {
                        alert('Aucun favori à nettoyer.');
                      }
                    }}
                    className="text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Nettoyer
                  </button>
                </div>
              </div>
              {favorites.length > 0 ? (
                renderFavoritesList(favorites)
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Star size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aucun favori enregistré</p>
                  <p className="text-sm">Ajoutez des répertoires depuis l'explorateur</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vb6' && (
            <div className="h-full p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-800 mb-4">
                Projets VB6 ({getFavoritesByType('vb6').length})
              </h3>
              {renderFavoritesList(getFavoritesByType('vb6'))}
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="h-full p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-800 mb-4">
                Récemment accédés ({getRecentlyAccessed().length})
              </h3>
              {renderFavoritesList(getRecentlyAccessed(10))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="h-full p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-800 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFavorites}</div>
                  <div className="text-sm text-blue-800">Total favoris</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.vb6Projects}</div>
                  <div className="text-sm text-green-800">Projets VB6</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.recentlyAccessed}</div>
                  <div className="text-sm text-purple-800">Récemment accédés</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.oldestFavorite ? 
                      Math.floor((Date.now() - stats.oldestFavorite.getTime()) / (1000 * 60 * 60 * 24)) : 0
                    }
                  </div>
                  <div className="text-sm text-orange-800">Jours (plus ancien)</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Plus ancien favori:</h4>
                  <p className="text-sm text-gray-600">
                    {stats.oldestFavorite?.toLocaleDateString() || 'Aucun'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Plus récent favori:</h4>
                  <p className="text-sm text-gray-600">
                    {stats.newestFavorite?.toLocaleDateString() || 'Aucun'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              title="Exporter les favoris"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              title="Importer des favoris"
            >
              <Upload size={16} />
              Importer
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritesManager;