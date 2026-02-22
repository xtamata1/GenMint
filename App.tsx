import React, { useState } from 'react';
import { Layers, Image as ImageIcon, BarChart3, Coins, Download, Loader2, Info, Moon } from 'lucide-react';
import { LayerManager } from './components/LayerManager';
import { LegendaryManager } from './components/LegendaryManager';
import { Gallery } from './components/Gallery';
import { Analytics } from './components/Analytics';
import { Mint } from './components/Mint';
import { About } from './components/About';
import { DEFAULT_LAYERS } from './constants';
import { Layer, CollectionSettings, GeneratedNFT, LegendaryItem } from './types';
import { generateCollection } from './services/generator';
import JSZip from 'jszip';
import saveAs from 'file-saver';

enum Tab {
  CREATE = 'CREATE',
  GALLERY = 'GALLERY',
  ANALYTICS = 'ANALYTICS',
  MINT = 'MINT',
  ABOUT = 'ABOUT'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CREATE);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [legendaries, setLegendaries] = useState<LegendaryItem[]>([]);
  const [settings, setSettings] = useState<CollectionSettings>({
    name: 'My NFT Collection',
    symbol: 'NFT',
    description: 'A cool collection generated on chain.',
    totalSupply: 10
  });
  const [collection, setCollection] = useState<GeneratedNFT[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ipfsGateway, setIpfsGateway] = useState('');
  const [imageCid, setImageCid] = useState('');

  const handleGenerate = async () => {
    if (layers.some(l => l.traits.length === 0)) {
      alert("Please add at least one trait to every layer!");
      return;
    }
    
    if (settings.totalSupply < legendaries.length) {
        alert(`Total supply (${settings.totalSupply}) cannot be less than legendary count (${legendaries.length})`);
        return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    try {
      // Small delay to let UI render the loading state
      setTimeout(async () => {
        const result = await generateCollection(layers, settings, legendaries, setProgress);
        setCollection(result);
        setIsGenerating(false);
        setActiveTab(Tab.GALLERY);
      }, 100);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      alert("Generation failed check console.");
    }
  };

  const exportZip = async () => {
    if (collection.length === 0) return;
    const zip = new JSZip();
    const images = zip.folder("images");
    const metadata = zip.folder("metadata");

    // CSV Header
    let csvContent = "id,name,description,dna,image_cid,attributes\n";

    collection.forEach(nft => {
      // Remove data:image/png;base64, prefix
      const base64Data = nft.image.split(',')[1];
      images?.file(`${nft.id}.png`, base64Data, { base64: true });
      
      // Use IPFS URL if gateway and CID are provided, otherwise use placeholder
      const imageUrl = (ipfsGateway && imageCid) 
        ? `${ipfsGateway.replace(/\/$/, '')}/${imageCid}/${nft.id}.png`
        : `ipfs://REPLACE_WITH_CID/${nft.id}.png`;

      const meta = {
        name: nft.name,
        description: nft.description,
        image: imageUrl,
        attributes: nft.attributes,
        dna: nft.dna,
      };
      
      metadata?.file(`${nft.id}.json`, JSON.stringify(meta, null, 2));

      // Add to CSV
      const attributesString = nft.attributes.map(a => `${a.trait_type}:${a.value}`).join(';');
      csvContent += `${nft.id},"${nft.name}","${nft.description}",${nft.dna},${imageUrl},"${attributesString}"\n`;
    });

    zip.file("collection.csv", csvContent);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${settings.name.replace(/\s+/g, '_')}_export.zip`);
  };

  return (
    <div className="min-h-screen pb-20 text-moon-text">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-moon-bg/80 backdrop-blur-lg border-b border-moon-border z-50 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-moon-border shadow-lg shadow-moon-accent/20">
            <img src="https://github.com/xtamata1/GenMint/blob/main/logo.png?raw=true" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-white hidden md:block">BlackMarket NFT's</h1>
        </div>

        <div className="flex items-center bg-moon-card/50 p-1 rounded-lg border border-moon-border">
          <button 
            onClick={() => setActiveTab(Tab.CREATE)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === Tab.CREATE ? 'bg-moon-border text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Create
          </button>
          <button 
            onClick={() => setActiveTab(Tab.GALLERY)}
            disabled={collection.length === 0}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === Tab.GALLERY ? 'bg-moon-border text-white shadow' : 'text-gray-400 hover:text-white disabled:opacity-30'}`}
          >
            Gallery
          </button>
          <button 
            onClick={() => setActiveTab(Tab.ANALYTICS)}
            disabled={collection.length === 0}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === Tab.ANALYTICS ? 'bg-moon-border text-white shadow' : 'text-gray-400 hover:text-white disabled:opacity-30'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab(Tab.MINT)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === Tab.MINT ? 'bg-moon-border text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Mint
          </button>
          <button 
            onClick={() => setActiveTab(Tab.ABOUT)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === Tab.ABOUT ? 'bg-moon-border text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <Info size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
           {collection.length > 0 && (
             <button 
               onClick={exportZip}
               className="hidden md:flex items-center gap-2 bg-moon-card hover:bg-moon-border text-moon-accent border border-moon-border px-3 py-1.5 rounded-lg text-sm transition-colors"
             >
               <Download size={16} /> Export (Images, JSON, CSV)
             </button>
           )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-7xl mx-auto">
        {activeTab === Tab.CREATE && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-moon-card p-6 rounded-xl border border-moon-border shadow-lg shadow-black/50">
                <h2 className="text-lg font-bold text-white mb-4">Collection Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Name</label>
                    <input 
                      type="text" 
                      value={settings.name}
                      onChange={e => setSettings({...settings, name: e.target.value})}
                      className="w-full bg-moon-bg border border-moon-border rounded p-2 text-white focus:border-moon-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Description</label>
                    <textarea 
                      value={settings.description}
                      onChange={e => setSettings({...settings, description: e.target.value})}
                      className="w-full bg-moon-bg border border-moon-border rounded p-2 text-white focus:border-moon-accent focus:outline-none h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Total Supply</label>
                    <input 
                      type="number" 
                      value={settings.totalSupply}
                      onChange={e => setSettings({...settings, totalSupply: Number(e.target.value)})}
                      className="w-full bg-moon-bg border border-moon-border rounded p-2 text-white focus:border-moon-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-moon-card to-moon-border border border-moon-accent/30 text-moon-accent hover:text-white rounded-xl font-bold text-lg shadow-lg shadow-moon-accent/10 hover:shadow-moon-accent/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                   <>
                     <Loader2 className="animate-spin" /> {progress}%
                   </>
                ) : (
                  <>
                    <ImageIcon /> Generate Collection
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <LegendaryManager 
                legendaries={legendaries} 
                setLegendaries={setLegendaries}
                settingsDescription={settings.description} 
              />
              <LayerManager layers={layers} setLayers={setLayers} />
            </div>
          </div>
        )}

        {activeTab === Tab.GALLERY && (
          <Gallery 
            collection={collection} 
            ipfsGateway={ipfsGateway}
            imageCid={imageCid}
          />
        )}
        {activeTab === Tab.ANALYTICS && (
          <Analytics 
            collection={collection} 
            ipfsGateway={ipfsGateway}
            setIpfsGateway={setIpfsGateway}
            imageCid={imageCid}
            setImageCid={setImageCid}
          />
        )}
        {activeTab === Tab.MINT && (
          <Mint 
            collection={collection} 
            settings={settings} 
            imageCid={imageCid}
            setImageCid={setImageCid}
          />
        )}
        {activeTab === Tab.ABOUT && <About />}
      </main>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <div className="w-64 space-y-6 text-center">
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-moon-border rounded-full"></div>
               <div className="absolute inset-0 border-4 border-moon-accent rounded-full border-t-transparent animate-spin shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-moon-accent">Forging NFT #{Math.floor((progress / 100) * settings.totalSupply)}</h2>
                <p className="text-gray-400 text-sm mt-1">Applying cryptographic signatures...</p>
            </div>
            
            <div className="h-2 bg-moon-border rounded-full overflow-hidden w-full">
              <div className="h-full bg-moon-accent transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;