import React from 'react';
import { Layer, Trait } from '../types';
import { Trash2, Plus, Upload, GripVertical } from 'lucide-react';
import { parseFilename } from '../services/generator';

interface LayerManagerProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}

export const LayerManager: React.FC<LayerManagerProps> = ({ layers, setLayers }) => {
  
  const handleFileUpload = (layerId: string, files: FileList | null) => {
    if (!files) return;

    const newTraits: Trait[] = Array.from(files).map((file) => {
      const { name, weight } = parseFilename(file.name);
      return {
        id: Math.random().toString(36).substr(2, 9),
        name,
        weight,
        file,
        preview: URL.createObjectURL(file),
      };
    });

    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        return { ...l, traits: [...l.traits, ...newTraits] };
      }
      return l;
    }));
  };

  const removeTrait = (layerId: string, traitId: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        return { ...l, traits: l.traits.filter(t => t.id !== traitId) };
      }
      return l;
    }));
  };

  const updateLayerName = (id: string, name: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const addLayer = () => {
    setLayers([...layers, { id: Math.random().toString(36).substr(2, 9), name: `Layer ${layers.length + 1}`, traits: [] }]);
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-100">Layers & Traits</h2>
        <button 
          onClick={addLayer}
          className="flex items-center gap-2 bg-cronos hover:bg-cronosLight text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Add Layer
        </button>
      </div>

      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.id} className="bg-card border border-gray-700 rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="text-gray-500 cursor-move" size={20} />
                <input
                  type="text"
                  value={layer.name}
                  onChange={(e) => updateLayerName(layer.id, e.target.value)}
                  className="bg-transparent text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 border-b border-transparent focus:border-accent"
                />
                <span className="text-xs text-gray-400">({layer.traits.length} traits)</span>
              </div>
              <button 
                onClick={() => removeLayer(layer.id)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Drop Zone */}
            <div className="relative group border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-accent hover:bg-gray-800 transition-all cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg"
                onChange={(e) => handleFileUpload(layer.id, e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center text-gray-400 group-hover:text-accent">
                <Upload size={24} className="mb-2" />
                <span className="text-sm font-medium">Drag & Drop or Click to Upload</span>
                <span className="text-xs mt-1 text-gray-500">Supports weighted names (e.g. Rare#1.png)</span>
              </div>
            </div>

            {/* Previews */}
            {layer.traits.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-4">
                {layer.traits.map(trait => (
                  <div key={trait.id} className="relative group bg-gray-900 rounded-md overflow-hidden aspect-square border border-gray-700">
                    <img src={trait.preview} alt={trait.name} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeTrait(layer.id, trait.id)}
                      className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1">
                       <p className="text-[10px] text-white truncate text-center">{trait.name}</p>
                       <p className="text-[8px] text-gray-300 text-center">Weight: {trait.weight}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
