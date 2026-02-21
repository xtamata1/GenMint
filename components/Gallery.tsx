import React, { useState } from 'react';
import { GeneratedNFT } from '../types';
import { Search, Download, ExternalLink } from 'lucide-react';
import saveAs from 'file-saver';

interface GalleryProps {
  collection: GeneratedNFT[];
}

export const Gallery: React.FC<GalleryProps> = ({ collection }) => {
  const [search, setSearch] = useState('');

  const filtered = collection.filter(nft => 
    nft.name.toLowerCase().includes(search.toLowerCase()) || 
    nft.attributes.some(a => a.value.toLowerCase().includes(search.toLowerCase()))
  );

  const downloadNFT = (nft: GeneratedNFT) => {
    saveAs(nft.image, `${nft.name.replace(/\s/g, '_')}.png`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-gray-700">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search traits or ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-white w-full"
        />
        <div className="text-sm text-gray-400 whitespace-nowrap">
          {filtered.length} items
        </div>
      </div>

      {collection.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No items generated yet. Go to Create tab.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(nft => (
            <div key={nft.id} className="bg-card rounded-xl overflow-hidden border border-gray-700 hover:border-accent transition-colors group">
              <div className="relative aspect-square">
                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => downloadNFT(nft)}
                    className="p-2 bg-white text-black rounded-full hover:bg-gray-200"
                    title="Download PNG"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-white truncate">{nft.name}</h3>
                  <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">#{nft.id}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {nft.attributes.slice(0, 3).map((attr, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                      {attr.value}
                    </span>
                  ))}
                  {nft.attributes.length > 3 && (
                    <span className="text-[10px] text-gray-500 pl-1">+{nft.attributes.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};