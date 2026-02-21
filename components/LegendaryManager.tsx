import React, { useState } from 'react';
import { LegendaryItem, Attribute } from '../types';
import { Trash2, Upload, Star, ArrowUp, ArrowDown, Plus, X, Settings2 } from 'lucide-react';

interface LegendaryManagerProps {
  legendaries: LegendaryItem[];
  setLegendaries: React.Dispatch<React.SetStateAction<LegendaryItem[]>>;
  settingsDescription: string;
}

export const LegendaryManager: React.FC<LegendaryManagerProps> = ({ legendaries, setLegendaries, settingsDescription }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newItems: LegendaryItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""), // Default to filename
      description: settingsDescription,
      image: file,
      preview: URL.createObjectURL(file),
      attributes: [{ trait_type: 'Rarity', value: 'Legendary' }] 
    }));

    setLegendaries(prev => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setLegendaries(prev => prev.filter(l => l.id !== id));
  };

  const updateItem = (id: string, field: keyof LegendaryItem, value: any) => {
    setLegendaries(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === legendaries.length - 1) return;

    const newItems = [...legendaries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setLegendaries(newItems);
  };

  const addAttribute = (id: string) => {
    setLegendaries(prev => prev.map(item => {
        if (item.id === id) {
            return { 
                ...item, 
                attributes: [...(item.attributes || []), { trait_type: '', value: '' }] 
            };
        }
        return item;
    }));
  };

  const updateAttribute = (itemId: string, attrIndex: number, field: keyof Attribute, value: string) => {
      setLegendaries(prev => prev.map(item => {
          if (item.id === itemId && item.attributes) {
              const newAttrs = [...item.attributes];
              newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value };
              return { ...item, attributes: newAttrs };
          }
          return item;
      }));
  };

  const removeAttribute = (itemId: string, attrIndex: number) => {
      setLegendaries(prev => prev.map(item => {
          if (item.id === itemId && item.attributes) {
              return { ...item, attributes: item.attributes.filter((_, i) => i !== attrIndex) };
          }
          return item;
      }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-moon-border pb-4">
        <div>
           <h2 className="text-xl font-bold text-moon-text flex items-center gap-2">
             <Star className="text-yellow-400 fill-yellow-400" size={20} />
             Legendary / 1-of-1s
           </h2>
           <p className="text-xs text-gray-400 mt-1">
             Images will be assigned to Token IDs #1 to #{legendaries.length}.
           </p>
        </div>
        <div className="text-xs font-mono bg-moon-card px-2 py-1 rounded border border-moon-border text-moon-accent">
            {legendaries.length} Slots Reserved
        </div>
      </div>

      {/* Upload Zone */}
      <div className="relative group border-2 border-dashed border-moon-border rounded-lg p-8 text-center hover:border-moon-accent hover:bg-moon-card transition-all cursor-pointer bg-moon-bg/50">
        <input
          type="file"
          multiple
          accept="image/png, image/jpeg, image/gif"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center text-gray-400 group-hover:text-moon-accent">
          <Upload size={32} className="mb-3" />
          <span className="text-base font-medium">Upload Legendary Images</span>
          <span className="text-xs mt-2 text-gray-500">Supported: PNG, JPG, GIF</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {legendaries.map((item, index) => (
          <div key={item.id} className="bg-moon-card border border-moon-border rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all hover:border-moon-border/80">
            <div className="flex gap-4 items-start">
                <div className="flex flex-col gap-1 pt-1">
                    <button 
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-moon-bg rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <div className="text-xs font-mono text-center text-moon-accent font-bold">#{index + 1}</div>
                    <button 
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === legendaries.length - 1}
                        className="p-1 hover:bg-moon-bg rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowDown size={16} />
                    </button>
                </div>

                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-moon-border bg-black relative group-hover:ring-2 ring-moon-accent/20 transition-all">
                    <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Name</label>
                            <input 
                            type="text" 
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="w-full bg-moon-bg border border-moon-border rounded px-3 py-1.5 text-sm text-moon-text focus:border-moon-accent focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Description</label>
                            <input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full bg-moon-bg border border-moon-border rounded px-3 py-1.5 text-sm text-moon-text focus:border-moon-accent focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${expandedId === item.id ? 'bg-moon-accent text-black' : 'bg-moon-bg text-gray-400 hover:text-white'}`}
                             >
                                 <Settings2 size={12} /> {item.attributes?.length || 0} Attributes
                             </button>
                        </div>
                        <button 
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-400 p-2 transition-colors flex items-center gap-1 text-xs"
                        >
                            <Trash2 size={14} /> Remove
                        </button>
                    </div>
                </div>
            </div>

            {/* Attributes Editor (Collapsible) */}
            {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t border-moon-border bg-black/20 -mx-4 px-4 pb-2">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Traits / Attributes</span>
                            <button onClick={() => addAttribute(item.id)} className="text-xs flex items-center gap-1 text-moon-accent hover:text-white">
                                <Plus size={12} /> Add Trait
                            </button>
                        </div>
                        {item.attributes?.map((attr, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input 
                                    placeholder="Trait Type (e.g. Rarity)"
                                    value={attr.trait_type}
                                    onChange={(e) => updateAttribute(item.id, idx, 'trait_type', e.target.value)}
                                    className="flex-1 bg-moon-bg border border-moon-border rounded px-2 py-1 text-xs text-white focus:border-moon-accent focus:outline-none"
                                />
                                <input 
                                    placeholder="Value (e.g. Legendary)"
                                    value={attr.value}
                                    onChange={(e) => updateAttribute(item.id, idx, 'value', e.target.value)}
                                    className="flex-1 bg-moon-bg border border-moon-border rounded px-2 py-1 text-xs text-white focus:border-moon-accent focus:outline-none"
                                />
                                <button onClick={() => removeAttribute(item.id, idx)} className="text-gray-600 hover:text-red-400">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {(!item.attributes || item.attributes.length === 0) && (
                            <p className="text-xs text-gray-600 italic">No attributes defined.</p>
                        )}
                    </div>
                </div>
            )}
          </div>
        ))}

        {legendaries.length === 0 && (
          <div className="text-center py-8 border border-dashed border-moon-border rounded-xl">
             <Star className="mx-auto text-gray-600 mb-2" size={24} />
             <p className="text-gray-500 text-sm">No legendary items added yet.</p>
             <p className="text-gray-600 text-xs">Upload images above to reserve Token IDs #1, #2...</p>
          </div>
        )}
      </div>
    </div>
  );
};