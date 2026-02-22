import React from 'react';
import { Layers, Zap, UploadCloud, Rocket, Hexagon, Code2, FolderArchive, Image as ImageIcon } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-moon-text via-white to-moon-accent">
          The No-Code NFT Forge
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          BlackMarket NFT's is a completely client-side tool to generate, manage, and mint NFT collections on the Cronos blockchain without needing a backend server.
        </p>
      </div>

      {/* BlackmoonCRO Token Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black border border-moon-border p-8 rounded-2xl relative overflow-hidden shadow-lg shadow-moon-accent/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Rocket className="text-moon-accent" /> Powered by BlackmoonCRO
            </h2>
            <p className="text-gray-400 leading-relaxed">
              The official utility token of the BlackMoon ecosystem on Cronos. 
              Support the project and join our community of creators.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg border border-gray-800 font-mono text-sm break-all">
              <span className="text-gray-500 block text-xs uppercase mb-1">Contract Address</span>
              <span className="text-moon-accent select-all">0xCb49dd81da680ed11d10809B51d5D5D8e36F9B6D</span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <a 
                href="https://dexscreener.com/cronos/0xCb49dd81da680ed11d10809B51d5D5D8e36F9B6D" 
                target="_blank" 
                rel="noreferrer"
                className="bg-moon-accent hover:bg-sky-400 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                <Zap size={18} /> View on DexScreener
              </a>
            </div>
          </div>
          
          <div className="w-32 h-32 bg-moon-accent/10 rounded-full flex items-center justify-center border-2 border-moon-accent/30 shadow-[0_0_30px_rgba(56,189,248,0.3)] overflow-hidden">
             <img src="https://github.com/xtamata1/GenMint/blob/main/logo.png?raw=true" alt="BlackmoonCRO Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Step 1 */}
        <div className="bg-moon-card border border-moon-border p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={100} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-moon-accent/20 rounded-lg flex items-center justify-center text-moon-accent mb-4">
              <span className="font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Build Layers</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload your trait images (PNGs) into layers like "Background", "Body", "Eyes". 
              Use filenames like <code>BlueHat#5.png</code> to set a rarity weight of 5 (lower is rarer).
              Add 1-of-1 "Legendary" images that skip generation and use specific IDs.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-moon-card border border-moon-border p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={100} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4">
              <span className="font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Generate</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Click Generate to create your entire collection in your browser's memory. 
              We calculate rarity stats instantly and prevent duplicate DNA combinations.
              Preview your gallery and filter by traits.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-moon-card border border-moon-border p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <UploadCloud size={100} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 mb-4">
              <span className="font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Export & Upload</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Export the collection as a ZIP file containing <code>images/</code> and <code>metadata/</code>.
              Upload the <code>images</code> folder to IPFS (using Pinata or NFT.Storage). 
              Update the metadata JSON files with your new IPFS image CID, then upload the <code>metadata</code> folder to IPFS to get your <strong>Base URI</strong>.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-moon-card border border-moon-border p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Rocket size={100} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 mb-4">
              <span className="font-bold">4</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Deploy & Mint</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Use the provided Hardhat script and Solidity contract. Set your Base URI in the contract.
              Deploy to Cronos Mainnet. 
              Use the "Mint" tab in this app (or host it yourself) to let users mint your NFTs!
            </p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-moon-card/50 border border-moon-border rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="text-moon-accent" /> Technical Specs
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
            <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                    <Hexagon size={16} className="mt-1 text-moon-accent" />
                    <span><strong>Chain:</strong> Cronos EVM (Chain ID 25)</span>
                </li>
                <li className="flex items-start gap-2">
                    <Hexagon size={16} className="mt-1 text-moon-accent" />
                    <span><strong>Standard:</strong> ERC-721A (Low Gas)</span>
                </li>
                <li className="flex items-start gap-2">
                    <Hexagon size={16} className="mt-1 text-moon-accent" />
                    <span><strong>Storage:</strong> IPFS (Decentralized)</span>
                </li>
            </ul>
            <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                    <Hexagon size={16} className="mt-1 text-moon-accent" />
                    <span><strong>Generation:</strong> Weighted Randomness (Client-side)</span>
                </li>
                <li className="flex items-start gap-2">
                    <Hexagon size={16} className="mt-1 text-moon-accent" />
                    <span><strong>Framework:</strong> React + Vite + Tailwind + Ethers.js</span>
                </li>
            </ul>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center pt-8 border-t border-moon-border">
          <p className="text-moon-accent font-medium italic">App developed by xtamata (Gentleman)</p>
          <p className="text-gray-500 text-sm mt-2">@blazing_dranzer</p>
      </div>

    </div>
  );
};
