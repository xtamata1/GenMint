import React, { useState, useEffect } from 'react';
import { GeneratedNFT } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, Database, FileJson, Rocket } from 'lucide-react';
import { NFTStorage } from 'nft.storage';
import { ethers } from 'ethers';
import { STANDARD_ERC721A_ABI, STANDARD_ERC721A_BYTECODE } from '../contracts/StandardERC721A';
import { CRONOS_CHAIN_ID } from '../constants';

interface AnalyticsProps {
  collection: GeneratedNFT[];
  ipfsGateway: string;
  setIpfsGateway: (url: string) => void;
  imageCid: string;
  setImageCid: (cid: string) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ collection, ipfsGateway, setIpfsGateway, imageCid, setImageCid }) => {
  const [uploadProvider, setUploadProvider] = useState<'pinata' | 'nftstorage'>('pinata');
  const [pinataJwt, setPinataJwt] = useState('');
  const [nftStorageKey, setNftStorageKey] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading_images' | 'uploading_metadata' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [baseUri, setBaseUri] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    if ((window as any).ethereum) {
      setProvider(new ethers.BrowserProvider((window as any).ethereum));
    }
  }, []);

  if (collection.length === 0) {
    return <div className="text-center py-20 text-gray-500">No data available. Generate collection first.</div>;
  }

  // ... (stats calculation)
  const stats: Record<string, Record<string, number>> = {};
  collection.forEach(nft => {
    nft.attributes.forEach(attr => {
      if (!stats[attr.trait_type]) stats[attr.trait_type] = {};
      stats[attr.trait_type][attr.value] = (stats[attr.trait_type][attr.value] || 0) + 1;
    });
  });

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handlePinataUpload = async () => {
    // ... (existing implementation)
    if (!pinataJwt) {
      alert("Please enter your Pinata JWT.");
      return;
    }

    setUploadStatus('uploading_images');
    setProgress(0);
    setErrorMsg('');

    try {
      // 1. Upload Images
      const imageFormData = new FormData();
      const imageFolderName = "images";

      collection.forEach((nft) => {
        const blob = dataURItoBlob(nft.image);
        imageFormData.append('file', blob, `${imageFolderName}/${nft.id}.png`);
      });

      const pinataMetadataImages = JSON.stringify({
        name: `Collection Images`
      });
      imageFormData.append('pinataMetadata', pinataMetadataImages);
      imageFormData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const imageUploadXhr = new XMLHttpRequest();
      imageUploadXhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
      imageUploadXhr.setRequestHeader('Authorization', `Bearer ${pinataJwt}`);

      await new Promise((resolve, reject) => {
        imageUploadXhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setProgress(Math.round(percent));
          }
        };
        imageUploadXhr.onload = () => {
          if (imageUploadXhr.status === 200) {
            resolve(JSON.parse(imageUploadXhr.responseText));
          } else {
            reject(new Error("Image upload failed: " + imageUploadXhr.responseText));
          }
        };
        imageUploadXhr.onerror = () => reject(new Error("Network error during image upload"));
        imageUploadXhr.send(imageFormData);
      }).then(async (response: any) => {
        const uploadedImageCid = response.IpfsHash;
        setImageCid(uploadedImageCid); // Update global state
        
        // 2. Upload Metadata
        setUploadStatus('uploading_metadata');
        setProgress(0);

        const metaFormData = new FormData();
        const metaFolderName = "metadata";

        collection.forEach((nft) => {
          const meta = {
            name: nft.name,
            description: nft.description,
            image: `ipfs://${uploadedImageCid}/${nft.id}.png`,
            attributes: nft.attributes,
            dna: nft.dna,
          };
          const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
          metaFormData.append('file', blob, `${metaFolderName}/${nft.id}.json`);
        });

        const pinataMetadataMeta = JSON.stringify({
          name: `Collection Metadata`
        });
        metaFormData.append('pinataMetadata', pinataMetadataMeta);
        metaFormData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        const metaUploadXhr = new XMLHttpRequest();
        metaUploadXhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
        metaUploadXhr.setRequestHeader('Authorization', `Bearer ${pinataJwt}`);

        await new Promise((resolve, reject) => {
          metaUploadXhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100;
              setProgress(Math.round(percent));
            }
          };
          metaUploadXhr.onload = () => {
            if (metaUploadXhr.status === 200) {
              resolve(JSON.parse(metaUploadXhr.responseText));
            } else {
              reject(new Error("Metadata upload failed: " + metaUploadXhr.responseText));
            }
          };
          metaUploadXhr.onerror = () => reject(new Error("Network error during metadata upload"));
          metaUploadXhr.send(metaFormData);
        }).then((response: any) => {
          const metaCid = response.IpfsHash;
          setBaseUri(`ipfs://${metaCid}/`);
          setUploadStatus('success');
        });
      });

    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      setErrorMsg(error.message || "Upload failed");
    }
  };

  const handleNFTStorageUpload = async () => {
    const key = nftStorageKey.trim();
    if (!key) {
      alert("Please enter your NFT.Storage API Key.");
      return;
    }

    setUploadStatus('uploading_images');
    setProgress(0); // NFT.Storage client doesn't provide granular progress easily
    setErrorMsg('');

    try {
      const client = new NFTStorage({ token: key });

      // Prepare files for NFT.Storage
      // NFT.Storage expects an array of File objects.
      // We will upload images first to get their CIDs, then metadata.
      // Actually, NFT.Storage has a `storeDirectory` method.

      // 1. Upload Images Directory
      const imageFiles = collection.map((nft) => {
        const blob = dataURItoBlob(nft.image);
        return new File([blob], `${nft.id}.png`, { type: 'image/png' });
      });

      setUploadStatus('uploading_images');
      // Note: storeDirectory returns the CID of the directory
      const uploadedImageCid = await client.storeDirectory(imageFiles);
      setImageCid(uploadedImageCid); // Update global state
      
      // 2. Upload Metadata Directory
      setUploadStatus('uploading_metadata');
      
      const metadataFiles = collection.map((nft) => {
         const meta = {
            name: nft.name,
            description: nft.description,
            image: `ipfs://${uploadedImageCid}/${nft.id}.png`,
            attributes: nft.attributes,
            dna: nft.dna,
          };
          const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
          return new File([blob], `${nft.id}.json`, { type: 'application/json' });
      });

      const metaCid = await client.storeDirectory(metadataFiles);
      
      // Ensure the CID is valid before setting base URI
      if (metaCid) {
          const newBaseUri = `ipfs://${metaCid}/`;
          setBaseUri(newBaseUri);
          setUploadStatus('success');
      } else {
          throw new Error("Failed to retrieve CID from NFT.Storage");
      }

    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      if (error.message && error.message.includes("API Key is malformed")) {
          setErrorMsg("Invalid API Key. Please check that you copied the full key.");
      } else {
          setErrorMsg(error.message || "Upload failed");
      }
    }
  }

  const validateCollection = () => {
    // ... (existing implementation)
    const errors: string[] = [];
    
    collection.forEach((nft) => {
      if (!nft.name) errors.push(`NFT #${nft.id}: Missing name`);
      if (!nft.description) errors.push(`NFT #${nft.id}: Missing description`);
      if (!nft.image) errors.push(`NFT #${nft.id}: Missing image data`);
      if (!Array.isArray(nft.attributes)) {
        errors.push(`NFT #${nft.id}: Attributes is not an array`);
      } else {
        nft.attributes.forEach((attr, idx) => {
          if (!attr.trait_type) errors.push(`NFT #${nft.id} Attribute #${idx}: Missing trait_type`);
          if (attr.value === undefined || attr.value === null) errors.push(`NFT #${nft.id} Attribute #${idx}: Missing value`);
        });
      }
    });

    if (errors.length > 0) {
      alert(`Validation Failed (${errors.length} errors):\n\n${errors.slice(0, 10).join('\n')}\n${errors.length > 10 ? '...' : ''}`);
    } else {
      alert(`✅ Validation Successful!\n\nAll ${collection.length} items have valid structure and attributes for ERC-721 metadata.`);
    }
  };

  const copyBaseUri = () => {
    navigator.clipboard.writeText(baseUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectWallet = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      setSigner(s);
      
      // Switch to Cronos
      const { chainId } = await provider.getNetwork();
      if (Number(chainId) !== CRONOS_CHAIN_ID) {
         try {
           await (window as any).ethereum.request({
             method: 'wallet_switchEthereumChain',
             params: [{ chainId: '0x19' }], // Cronos Mainnet
           });
         } catch (switchError: any) {
           if (switchError.code === 4902) {
             alert("Please add Cronos Mainnet to your wallet.");
           }
         }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deployContract = async () => {
    if (!signer) {
        await connectWallet();
        if (!signer) return; // Still no signer?
    }
    
    if (!baseUri) {
        alert("Please upload metadata first to get a Base URI.");
        return;
    }

    setIsDeploying(true);
    try {
        if (!STANDARD_ERC721A_BYTECODE || STANDARD_ERC721A_BYTECODE === "0x") {
            throw new Error("Contract bytecode is missing. Please ensure contracts are compiled.");
        }

        const factory = new ethers.ContractFactory(STANDARD_ERC721A_ABI, STANDARD_ERC721A_BYTECODE, signer);
        
        // Deploy with default settings (can be customized if we passed settings prop, but using defaults for quick deploy)
        // Name: "My Collection", Symbol: "NFT", Supply: collection.length, Cost: 10 CRO
        const contract = await factory.deploy(
            "My Generated Collection", 
            "NFT", 
            collection.length, 
            ethers.parseEther("10"), 
            baseUri
        );
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        setDeployedAddress(address);
        alert(`Contract deployed successfully to ${address}`);
    } catch (e: any) {
        console.error(e);
        let msg = e.reason || e.message;
        if (msg.includes("execution reverted")) {
            msg = "Transaction failed. Likely due to insufficient funds or gas estimation error. Ensure you have enough CRO on Cronos Mainnet.";
        }
        alert("Deployment failed: " + msg);
    } finally {
        setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ... (Charts) ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Supply</h3>
          <p className="text-3xl font-bold text-white mt-1">{collection.length}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Unique DNA</h3>
          <p className="text-3xl font-bold text-accent mt-1">{collection.length}</p> 
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Estimated Market Cap</h3>
          <p className="text-3xl font-bold text-green-400 mt-1">-- CRO</p>
        </div>
      </div>

      {/* Direct Upload Section */}
      <div className="bg-moon-card border border-moon-border rounded-xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="text-moon-accent" /> Direct Upload to IPFS
            </h2>
            <button
                onClick={validateCollection}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 flex items-center gap-2 transition-colors"
            >
                <FileJson size={14} className="text-green-400" /> Validate Metadata
            </button>
        </div>

        {/* IPFS Gateway Configuration */}
        <div className="mb-6 bg-black/30 p-4 rounded-lg border border-moon-border">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <ExternalLink size={14} className="text-moon-accent" /> IPFS Gateway Configuration
            </h3>
            <p className="text-xs text-gray-400 mb-3">
                Enter an IPFS gateway URL (e.g., <code>https://ipfs.io/ipfs/</code> or <code>https://gateway.pinata.cloud/ipfs/</code>) to preview your images using the IPFS CID.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">IPFS Gateway URL</label>
                    <input 
                        type="text" 
                        placeholder="https://ipfs.io/ipfs/"
                        value={ipfsGateway}
                        onChange={(e) => setIpfsGateway(e.target.value)}
                        className="w-full bg-moon-bg border border-moon-border rounded-lg px-3 py-2 text-white text-sm focus:border-moon-accent focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Image CID (Auto-filled after upload)</label>
                    <input 
                        type="text" 
                        placeholder="Qm..."
                        value={imageCid}
                        onChange={(e) => setImageCid(e.target.value)}
                        className="w-full bg-moon-bg border border-moon-border rounded-lg px-3 py-2 text-white text-sm focus:border-moon-accent focus:outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Provider Switcher */}
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setUploadProvider('pinata')}
                className={`flex-1 py-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${uploadProvider === 'pinata' ? 'bg-moon-accent text-black border-moon-accent' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
            >
                <UploadCloud size={18} /> Pinata
            </button>
            <button 
                onClick={() => setUploadProvider('nftstorage')}
                className={`flex-1 py-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${uploadProvider === 'nftstorage' ? 'bg-moon-accent text-black border-moon-accent' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
            >
                <Database size={18} /> NFT.Storage
            </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {uploadProvider === 'pinata' 
                ? "Upload directly to Pinata. Requires a Pinata JWT." 
                : "Upload directly to NFT.Storage. Requires an API Key."}
            </p>
            
            {uploadProvider === 'pinata' ? (
                <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pinata JWT</label>
                <input 
                    type="password" 
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                    value={pinataJwt}
                    onChange={(e) => setPinataJwt(e.target.value)}
                    className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-moon-accent focus:outline-none"
                />
                </div>
            ) : (
                <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">NFT.Storage API Key</label>
                <input 
                    type="password" 
                    placeholder="eyJ..."
                    value={nftStorageKey}
                    onChange={(e) => setNftStorageKey(e.target.value)}
                    className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-moon-accent focus:outline-none"
                />
                </div>
            )}

            <button 
              onClick={uploadProvider === 'pinata' ? handlePinataUpload : handleNFTStorageUpload}
              disabled={uploadStatus.startsWith('uploading') || collection.length === 0}
              className="bg-moon-accent hover:bg-sky-400 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
            >
              {uploadStatus.startsWith('uploading') ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
              {uploadStatus === 'idle' ? 'Upload Collection' : 
               uploadStatus === 'uploading_images' ? 'Uploading Images...' : 
               uploadStatus === 'uploading_metadata' ? 'Uploading Metadata...' : 'Upload Complete'}
            </button>
          </div>

          <div className="bg-black/30 rounded-lg p-4 border border-moon-border flex flex-col justify-center items-center text-center min-h-[200px]">
            {uploadStatus === 'idle' && (
              <div className="text-gray-500 flex flex-col items-center gap-2">
                <UploadCloud size={40} className="opacity-20" />
                <span>Ready to upload</span>
              </div>
            )}
            
            {uploadStatus.startsWith('uploading') && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-moon-accent font-bold">
                  <span>{uploadStatus === 'uploading_images' ? 'Uploading Images' : 'Uploading Metadata'}...</span>
                  <span>{uploadProvider === 'pinata' ? `${progress}%` : '(Please wait)'}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-moon-accent transition-all duration-300" style={{ width: uploadProvider === 'pinata' ? `${progress}%` : '100%' }}></div>
                </div>
                {uploadProvider === 'nftstorage' && <p className="text-xs text-gray-500 animate-pulse">Processing large files...</p>}
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="text-green-400" size={40} />
                  <h3 className="text-white font-bold">Upload Complete!</h3>
                </div>
                
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-left">
                  <label className="text-xs text-gray-500 uppercase block mb-1">
                    Your Base URI ({uploadProvider === 'pinata' ? 'Pinata' : 'NFT.Storage'})
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-green-400 break-all flex-1 font-mono">
                      {baseUri}
                    </code>
                    <button onClick={copyBaseUri} className="text-gray-400 hover:text-white transition-colors" title="Copy URI">
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    {baseUri.startsWith('ipfs://') && (
                        <a 
                            href={`https://ipfs.io/ipfs/${baseUri.replace('ipfs://', '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                            title="View on IPFS Gateway"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Copy this Base URI and paste it into the "Smart Contract" section to deploy your contract.
                </p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-red-400 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                <AlertCircle size={40} />
                <span className="font-bold">Upload Failed</span>
                <span className="text-xs text-center max-w-[200px]">{errorMsg}</span>
                <button 
                  onClick={() => setUploadStatus('idle')}
                  className="text-xs underline hover:text-red-300 mt-2"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deploy Section */}
      <div className="bg-moon-card border border-moon-border rounded-xl p-6 relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Rocket className="text-blue-400" /> Deploy to Cronos
        </h2>
        <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Once you have your Base URI from the upload step above, you can deploy your collection directly to Cronos Mainnet.
                </p>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Base URI</label>
                    <input 
                        type="text" 
                        value={baseUri}
                        onChange={(e) => setBaseUri(e.target.value)}
                        placeholder="ipfs://..."
                        className="w-full bg-transparent text-sm text-green-400 font-mono focus:outline-none border-b border-gray-700 focus:border-green-400 transition-colors"
                    />
                </div>
                <button 
                    onClick={deployContract}
                    disabled={!baseUri || isDeploying}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isDeploying ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                    {isDeploying ? 'Deploying...' : 'Deploy Contract'}
                </button>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 border border-moon-border flex flex-col justify-center items-center text-center min-h-[150px]">
                {!deployedAddress ? (
                    <div className="text-gray-500">
                        <p className="mb-2">Contract not deployed yet.</p>
                        <p className="text-xs">Connect wallet and click deploy to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-300">
                        <CheckCircle2 className="text-green-400 mx-auto" size={40} />
                        <div>
                            <h3 className="text-white font-bold text-lg">Deployment Successful!</h3>
                            <p className="text-gray-400 text-sm">Your collection is live on Cronos.</p>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-left">
                            <label className="text-xs text-gray-500 uppercase block mb-1">Contract Address</label>
                            <div className="flex items-center gap-2">
                                <code className="text-sm text-blue-400 break-all flex-1 font-mono">
                                    {deployedAddress}
                                </code>
                                <a 
                                    href={`https://cronoscan.com/address/${deployedAddress}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(stats).map(([traitType, counts]) => {
          const data = Object.entries(counts)
            .map(([name, count]) => ({
              name,
              count,
              percent: ((count / collection.length) * 100).toFixed(1)
            }))
            .sort((a, b) => a.count - b.count); // Rarest first

          return (
            <div key={traitType} className="bg-card p-4 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 capitalize">{traitType} Rarity</h3>
              <div className="h-64 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#38BDF8' : '#64748b'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
