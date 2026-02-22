import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, AlertCircle, CheckCircle2, Loader2, ExternalLink, Copy, Check, Ticket, Code2, UploadCloud, FileJson, Package, Hammer, RefreshCw, Database } from 'lucide-react';
import { CRONOS_CHAIN_ID, CRONOS_RPC_URL } from '../constants';
import { GeneratedNFT, CollectionSettings } from '../types';
import { STANDARD_ERC721A_ABI, STANDARD_ERC721A_BYTECODE } from '../contracts/StandardERC721A';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { NFTStorage } from 'nft.storage';

// Minimal ABI for Minting & Admin
const ABI = [
  "function mint(uint256 quantity) external payable",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function cost() view returns (uint256)",
  "function paused() view returns (bool)",
  "function maxPerWallet() view returns (uint256)",
  "function owner() view returns (address)",
  "function setPaused(bool _state) external",
  "function setCost(uint256 _newCost) external",
  "function setBaseURI(string memory _newBaseURI) external",
  "function withdraw() external"
];

interface MintProps {
  collection: GeneratedNFT[];
  settings: CollectionSettings;
}

export const Mint: React.FC<MintProps> = ({ collection, settings }) => {
  const [mode, setMode] = useState<'creator' | 'public'>('creator');
  
  // Creator State
  const [imageCid, setImageCid] = useState('');
  const [uploadProvider, setUploadProvider] = useState<'pinata' | 'nftstorage'>('pinata');
  const [pinataJwt, setPinataJwt] = useState('');
  const [nftStorageKey, setNftStorageKey] = useState('');
  const [baseUri, setBaseUri] = useState('');
  const [metadataStatus, setMetadataStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Minting State
  const [contractAddress, setContractAddress] = useState('');
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [readProvider, setReadProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [supply, setSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [cost, setCost] = useState('0');
  const [paused, setPaused] = useState(false);
  const [mintAmount, setMintAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [mintedIds, setMintedIds] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Admin State
  const [isOwner, setIsOwner] = useState(false);
  const [newCost, setNewCost] = useState('');
  const [newBaseUri, setNewBaseUri] = useState('');

  useEffect(() => {
    // Initialize read-only provider for global access
    try {
        // Pass static network to avoid "failed to detect network" errors on startup
        // Cronos Mainnet: Chain ID 25
        const network = ethers.Network.from({ chainId: CRONOS_CHAIN_ID, name: 'cronos' });
        const rp = new ethers.JsonRpcProvider(CRONOS_RPC_URL, network, { staticNetwork: network });
        setReadProvider(rp);
    } catch (e) {
        console.error("Failed to init read provider", e);
    }

    if ((window as any).ethereum) {
      setProvider(new ethers.BrowserProvider((window as any).ethereum));
    }
  }, []);

  // ... (rest of the component)

  // --- ADMIN FUNCTIONS ---
  const checkOwner = async () => {
      if (!contractAddress || !provider || !account) return;
      try {
          const contract = new ethers.Contract(contractAddress, ABI, provider);
          const owner = await contract.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (e) {
          console.error("Error checking owner", e);
      }
  };

  useEffect(() => {
      if (account && contractAddress) {
          checkOwner();
      }
  }, [account, contractAddress]);

  const togglePause = async () => {
      if (!signer) return;
      setLoading(true);
      try {
          const contract = new ethers.Contract(contractAddress, ABI, signer);
          const tx = await contract.setPaused(!paused);
          await tx.wait();
          loadContractData();
          alert("Pause state updated!");
      } catch (e) {
          console.error(e);
          alert("Failed to update pause state");
      } finally {
          setLoading(false);
      }
  };

  const updateCost = async () => {
      if (!signer || !newCost) return;
      setLoading(true);
      try {
          const contract = new ethers.Contract(contractAddress, ABI, signer);
          const tx = await contract.setCost(ethers.parseEther(newCost));
          await tx.wait();
          loadContractData();
          alert("Cost updated!");
      } catch (e) {
          console.error(e);
          alert("Failed to update cost");
      } finally {
          setLoading(false);
      }
  };

  const updateBaseUri = async () => {
      if (!signer || !newBaseUri) return;
      setLoading(true);
      try {
          const contract = new ethers.Contract(contractAddress, ABI, signer);
          const tx = await contract.setBaseURI(newBaseUri);
          await tx.wait();
          loadContractData();
          alert("Base URI updated!");
      } catch (e) {
          console.error(e);
          alert("Failed to update Base URI");
      } finally {
          setLoading(false);
      }
  };

  const withdrawFunds = async () => {
      if (!signer) return;
      setLoading(true);
      try {
          const contract = new ethers.Contract(contractAddress, ABI, signer);
          const tx = await contract.withdraw();
          await tx.wait();
          alert("Funds withdrawn!");
      } catch (e) {
          console.error(e);
          alert("Failed to withdraw funds");
      } finally {
          setLoading(false);
      }
  };

  // ... (rest of the component)

  const deployContract = async () => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }

    // Check for placeholder bytecode
    if (!STANDARD_ERC721A_BYTECODE || STANDARD_ERC721A_BYTECODE.length < 500) {
        alert("Deployment Failed: The contract bytecode is a placeholder. You must compile the contract (e.g. in Remix) and update 'src/contracts/StandardERC721A.ts' with the real bytecode before deploying.");
        return;
    }

    setLoading(true);
    try {
      // Note: Using placeholder bytecode. In production, use real compiled bytecode.
      const factory = new ethers.ContractFactory(STANDARD_ERC721A_ABI, STANDARD_ERC721A_BYTECODE, signer);
      
      // Deploy with constructor arguments: name, symbol, maxSupply, cost, baseUri
      const contract = await factory.deploy(
        settings.name,
        settings.symbol,
        settings.totalSupply,
        ethers.parseEther("10"), // Default cost 10 CRO
        baseUri || "ipfs://placeholder/"
      );
      
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      setContractAddress(address);
      alert(`Contract deployed to ${address}`);
    } catch (e: any) {
      console.error(e);
      alert("Deployment failed: " + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  // --- CREATOR FUNCTIONS ---

  const handleUploadMetadata = async () => {
    if (uploadProvider === 'pinata' && !pinataJwt) {
        alert("Please enter a Pinata JWT.");
        return;
    }
    if (uploadProvider === 'nftstorage' && !nftStorageKey.trim()) {
        alert("Please enter an NFT.Storage API Key.");
        return;
    }
    if (!imageCid) {
        alert("Please enter the Image CID first.");
        return;
    }
    if (collection.length === 0) {
        alert("No collection generated yet.");
        return;
    }

    setMetadataStatus('uploading');
    setUploadProgress(0);

    try {
        if (uploadProvider === 'pinata') {
            const formData = new FormData();
            const folderName = "metadata";

            // Generate JSONs
            collection.forEach((nft) => {
                const meta = {
                    name: nft.name,
                    description: nft.description,
                    image: `ipfs://${imageCid}/${nft.id}.png`,
                    attributes: nft.attributes,
                    dna: nft.dna,
                };
                const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
                // Pinata directory upload requires relative paths in filename
                formData.append('file', blob, `${folderName}/${nft.id}.json`);
            });

            // Add folder metadata for Pinata
            const pinataMetadata = JSON.stringify({
                name: `${settings.name} Metadata`
            });
            formData.append('pinataMetadata', pinataMetadata);

            const pinataOptions = JSON.stringify({
                cidVersion: 1
            });
            formData.append('pinataOptions', pinataOptions);

            // Upload to Pinata
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
            xhr.setRequestHeader('Authorization', `Bearer ${pinataJwt}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(Math.round(percentComplete));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const newBaseUri = `ipfs://${response.IpfsHash}/`;
                    setBaseUri(newBaseUri);
                    setMetadataStatus('success');
                } else {
                    setMetadataStatus('error');
                    console.error("Pinata Error:", xhr.responseText);
                    alert("Upload failed. Check console or JWT.");
                }
            };

            xhr.onerror = () => {
                 setMetadataStatus('error');
                 alert("Network error.");
            };

            xhr.send(formData);
        } else {
            // NFT.Storage
            const client = new NFTStorage({ token: nftStorageKey.trim() });
            
            // Generate files
            const metadataFiles = collection.map((nft) => {
                const meta = {
                    name: nft.name,
                    description: nft.description,
                    image: `ipfs://${imageCid}/${nft.id}.png`,
                    attributes: nft.attributes,
                    dna: nft.dna,
                };
                const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
                return new File([blob], `${nft.id}.json`, { type: 'application/json' });
            });

            // Upload directory
            // Note: NFT.Storage client doesn't provide granular progress for directory upload easily via this method
            // We can simulate progress or just show indeterminate state
            setUploadProgress(50); 
            
            const metaCid = await client.storeDirectory(metadataFiles);
            setUploadProgress(100);
            setBaseUri(`ipfs://${metaCid}/`);
            setMetadataStatus('success');
        }

    } catch (e: any) {
        console.error(e);
        setMetadataStatus('error');
        alert("Upload failed: " + e.message);
    }
  };

  const downloadContractBundle = async () => {
      const zip = new JSZip();
      
      const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ${settings.symbol.replace(/[^a-zA-Z0-9]/g, '')} is ERC721A, Ownable {
    using Strings for uint256;

    uint256 public maxSupply = ${settings.totalSupply};
    uint256 public cost = 10 ether; // Update cost here
    string public baseURI = "${baseUri || "ipfs://YOUR_METADATA_CID/"}";
    bool public paused = false;

    constructor() ERC721A("${settings.name}", "${settings.symbol}") Ownable(msg.sender) {}

    function mint(uint256 quantity) external payable {
        require(!paused, "Mint is paused");
        require(totalSupply() + quantity <= maxSupply, "Max supply exceeded");
        require(msg.value >= cost * quantity, "Insufficient funds");
        
        _mint(msg.sender, quantity);
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setCost(uint256 _newCost) external onlyOwner {
        cost = _newCost;
    }

    function setPaused(bool _state) external onlyOwner {
        paused = _state;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success);
    }
}`;

      const deployScript = `const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Contract = await hre.ethers.getContractFactory("${settings.symbol.replace(/[^a-zA-Z0-9]/g, '')}");
  // Constructor arguments are handled in the contract itself in this template, 
  // but if you added args, pass them here.
  const nft = await Contract.deploy();

  await nft.waitForDeployment();
  console.log("Contract deployed to:", await nft.getAddress());
  
  // Verify after delay
  console.log("Waiting for confirmations...");
  await nft.deploymentTransaction().wait(5);
  
  try {
      await hre.run("verify:verify", {
          address: await nft.getAddress(),
          constructorArguments: [],
      });
  } catch (e) {
      console.log("Verification error:", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;

      zip.file(`${settings.symbol}Contract.sol`, solidityCode);
      zip.file(`deploy.js`, deployScript);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${settings.symbol}_Contract_Bundle.zip`);
  };

  // --- MINTING FUNCTIONS ---
  
  const triggerConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#38BDF8', '#6366f1', '#ffffff'] // Moon theme colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#38BDF8', '#6366f1', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
  };

  const connectWallet = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const s = await provider.getSigner();
      setSigner(s);
      const { chainId } = await provider.getNetwork();
      if (Number(chainId) !== CRONOS_CHAIN_ID) {
         try {
           await (window as any).ethereum.request({
             method: 'wallet_switchEthereumChain',
             params: [{ chainId: '0x19' }],
           });
         } catch (switchError: any) {
           if (switchError.code === 4902) {
             alert("Please add Cronos Mainnet to your wallet.");
           }
         }
      }
    } catch (err: any) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        console.log("User rejected connection");
        return;
      }
      console.error(err);
    }
  };

  useEffect(() => {
      if (ethers.isAddress(contractAddress)) {
          loadContractData();
      }
  }, [contractAddress, provider]);

  const loadContractData = async () => {
    if (!ethers.isAddress(contractAddress)) return;
    
    // Prefer readProvider for reading data to ensure global access, fallback to wallet provider
    let activeProvider = readProvider || provider;
    if (!activeProvider) return;

    setLoading(true);
    setErrorMsg('');
    try {
      // Try fetching code to verify connectivity and contract existence
      let code;
      try {
          code = await activeProvider.getCode(contractAddress);
      } catch (err) {
          console.warn("Read provider failed, falling back to wallet provider if available", err);
          if (readProvider && provider) {
              activeProvider = provider;
              code = await activeProvider.getCode(contractAddress);
          } else {
              throw err;
          }
      }

      if (code === '0x') {
          throw new Error("No contract found at this address");
      }
      // Placeholder bytecode is usually very small (< 300 bytes)
      // Real ERC721A is usually > 5KB
      if (code.length < 500) {
          console.warn("Contract bytecode is too small:", code);
          throw new Error("This contract seems to be invalid or a placeholder. Please redeploy with real bytecode.");
      }

      const contract = new ethers.Contract(contractAddress, ABI, activeProvider);
      
      // Use Promise.allSettled to prevent one failure from breaking everything
      const [tsResult, msResult, cResult, pResult] = await Promise.allSettled([
          contract.totalSupply(),
          contract.maxSupply(),
          contract.cost(),
          contract.paused()
      ]);

      const ts = tsResult.status === 'fulfilled' ? tsResult.value : BigInt(0);
      const ms = msResult.status === 'fulfilled' ? msResult.value : BigInt(0);
      const c = cResult.status === 'fulfilled' ? cResult.value : BigInt(0);
      const p = pResult.status === 'fulfilled' ? pResult.value : false;
      
      const loadedCost = ethers.formatEther(c);

      // Validate that the loaded mint price matches the mint price displayed in the UI
      // We ignore the initial '0' state as that's the default before loading
      if (cost !== '0' && Math.abs(Number(cost) - Number(loadedCost)) > 0.000001) {
          alert(`Price Mismatch Detected: The displayed price (${cost} CRO) does not match the actual contract price (${loadedCost} CRO). The UI will be updated.`);
      }

      setSupply(Number(ts));
      setMaxSupply(Number(ms));
      setCost(loadedCost);
      setPaused(p);

      if (tsResult.status === 'rejected' && msResult.status === 'rejected') {
          console.warn("Contract calls failed. It might not be a valid ERC721A instance.");
          setErrorMsg("Contract found but failed to read data. It might not be a compatible ERC721A.");
      } else {
          // Success
          setStatus('idle');
      }

    } catch (e: any) {
      console.error("Error reading contract", e);
      setStatus('error');
      setErrorMsg(e.message || "Failed to load contract data.");
    } finally {
      setLoading(false);
    }
  };

  const mint = async () => {
    if (!signer || !contractAddress) return;
    
    // Pre-flight checks
    if (paused) {
        alert("Minting is currently paused by the owner.");
        return;
    }
    if (maxSupply > 0 && supply + mintAmount > maxSupply) {
        alert(`Exceeds max supply. Only ${maxSupply - supply} remaining.`);
        return;
    }

    setStatus('idle');
    setLoading(true);
    setMintedIds([]);
    setErrorMsg('');

    try {
      const contract = new ethers.Contract(contractAddress, ABI, signer);
      
      // Safer value calculation using BigInt
      // cost is a string in Ether (e.g., "10.0")
      const costWei = ethers.parseEther(cost);
      const totalCostWei = costWei * BigInt(mintAmount);

      // Check user balance
      if (provider) {
          const balance = await provider.getBalance(await signer.getAddress());
          if (balance < totalCostWei) {
              throw new Error(`Insufficient funds. You need ${ethers.formatEther(totalCostWei)} CRO + Gas, but you have ${ethers.formatEther(balance)} CRO.`);
          }
      }

      // Estimate gas first to catch errors early
      try {
          await contract.mint.estimateGas(mintAmount, { value: totalCostWei });
      } catch (gasError: any) {
          console.error("Gas estimation failed:", gasError);
          // If gas estimation fails, it's usually a revert condition
          let reason = "Transaction would fail. ";
          if (gasError.message.includes("insufficient funds")) reason += "Insufficient funds for gas. ";
          else if (gasError.message.includes("paused")) reason += "Minting is paused. ";
          else if (gasError.message.includes("exceeds")) reason += "Exceeds max supply or wallet limit. ";
          else reason += "Check contract limits (paused, max supply, etc).";
          
          throw new Error(reason);
      }
      
      const tx = await contract.mint(mintAmount, { value: totalCostWei });
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      
      const ids: number[] = [];
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
           if (log.address.toLowerCase() === contractAddress.toLowerCase() && log.topics.length === 4) {
               const from = log.topics[1];
               const isMint = BigInt(from) === BigInt(0);
               if (isMint) {
                   const id = Number(BigInt(log.topics[3]));
                   ids.push(id);
               }
           }
        }
      }
      setMintedIds(ids);

      setStatus('success');
      triggerConfetti();
      loadContractData();
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      // Extract meaningful error message
      let msg = e.reason || e.message || "Mint failed";
      if (msg.includes("user rejected")) msg = "Transaction rejected by user.";
      else if (msg.includes("insufficient funds")) msg = "Insufficient funds for transaction.";
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = () => {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-moon-card p-1 rounded-lg border border-moon-border inline-flex">
          <button
            onClick={() => setMode('creator')}
            className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'creator' ? 'bg-moon-accent text-black shadow-lg shadow-moon-accent/20' : 'text-gray-400 hover:text-white'}`}
          >
            <Hammer size={16} /> Creator Studio
          </button>
          <button
             onClick={() => setMode('public')}
             className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'public' ? 'bg-moon-accent text-black shadow-lg shadow-moon-accent/20' : 'text-gray-400 hover:text-white'}`}
          >
            <Ticket size={16} /> Public Mint Page
          </button>
        </div>
      </div>

      {mode === 'creator' ? (
        /* CREATOR DASHBOARD */
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
           {/* Step 1: Metadata Preparation */}
           <div className="bg-moon-card border border-moon-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileJson className="text-moon-accent" /> 1. Metadata Preparation
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                  After exporting your images and uploading them to IPFS (via Pinata, NFT.Storage, etc.), enter the Image CID here to update your metadata.
              </p>
              <div className="flex gap-4 items-end">
                  <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">IPFS Image CID (Folder Hash)</label>
                      <input 
                        type="text" 
                        placeholder="Qm..."
                        value={imageCid}
                        onChange={(e) => setImageCid(e.target.value)}
                        className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-moon-accent focus:outline-none"
                      />
                  </div>
              </div>
           </div>

           {/* Step 2: Upload Metadata */}
           <div className="bg-moon-card border border-moon-border rounded-xl p-6 relative overflow-hidden">
               <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UploadCloud className="text-purple-400" /> 2. Upload Metadata
               </h2>
               
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
                                ? "Provide a Pinata JWT to upload your metadata JSONs directly to IPFS." 
                                : "Provide an NFT.Storage API Key to upload your metadata JSONs directly to IPFS."}
                        </p>
                        
                        {uploadProvider === 'pinata' ? (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pinata JWT</label>
                                <input 
                                    type="password" 
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                                    value={pinataJwt}
                                    onChange={(e) => setPinataJwt(e.target.value)}
                                    className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
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
                                    className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                                />
                            </div>
                        )}

                        <button 
                            onClick={handleUploadMetadata}
                            disabled={metadataStatus === 'uploading' || collection.length === 0}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                        >
                            {metadataStatus === 'uploading' ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
                            Upload Metadata Folder
                        </button>
                   </div>

                   <div className="bg-black/30 rounded-lg p-4 border border-moon-border flex flex-col justify-center items-center text-center">
                        {metadataStatus === 'idle' && <span className="text-gray-500">Waiting for upload...</span>}
                        
                        {metadataStatus === 'uploading' && (
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs text-purple-400 font-bold">
                                    <span>Uploading...</span>
                                    <span>{uploadProvider === 'pinata' ? `${uploadProgress}%` : '(Please wait)'}</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: uploadProvider === 'pinata' ? `${uploadProgress}%` : '100%' }}></div>
                                </div>
                                {uploadProvider === 'nftstorage' && <p className="text-xs text-gray-500 animate-pulse">Processing...</p>}
                            </div>
                        )}

                        {metadataStatus === 'success' && (
                            <div className="space-y-2 w-full">
                                <CheckCircle2 className="text-green-400 mx-auto" size={40} />
                                <h3 className="text-white font-bold">Upload Complete!</h3>
                                <div className="bg-gray-900 p-2 rounded text-xs text-gray-300 break-all border border-gray-700">
                                    {baseUri}
                                </div>
                                <p className="text-xs text-gray-500">Copy this Base URI for your contract.</p>
                            </div>
                        )}

                        {metadataStatus === 'error' && (
                            <div className="text-red-400 flex flex-col items-center gap-2">
                                <AlertCircle />
                                <span>Upload Failed.</span>
                            </div>
                        )}
                   </div>
               </div>
           </div>

           {/* Step 3: Contract Generation */}
           <div className="bg-moon-card border border-moon-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Code2 className="text-green-400" /> 3. Smart Contract
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Base URI</label>
                          <input 
                            type="text" 
                            placeholder="ipfs://..."
                            value={baseUri}
                            onChange={(e) => setBaseUri(e.target.value)}
                            className="w-full bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none"
                          />
                      </div>
                      <div className="p-4 bg-gray-900/50 rounded-lg border border-moon-border space-y-2">
                          <h4 className="font-bold text-white text-sm">Config Preview</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                              <span>Name: <span className="text-white">{settings.name}</span></span>
                              <span>Symbol: <span className="text-white">{settings.symbol}</span></span>
                              <span>Supply: <span className="text-white">{settings.totalSupply}</span></span>
                          </div>
                      </div>
                      <button 
                        onClick={downloadContractBundle}
                        className="w-full bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                      >
                          <Package size={20} /> Download Contract Bundle (.zip)
                      </button>
                      <button 
                        onClick={deployContract}
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />} Deploy to Cronos
                      </button>
                      <p className="text-xs text-gray-500 text-center">Includes .sol contract and Hardhat deploy script.</p>
                      
                      <div className="mt-6 pt-6 border-t border-gray-800">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Already Deployed?</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  placeholder="Contract Address (0x...)" 
                                  className="flex-1 bg-moon-bg border border-moon-border rounded-lg px-3 py-2 text-sm text-white focus:border-moon-accent focus:outline-none"
                                  value={contractAddress}
                                  onChange={(e) => setContractAddress(e.target.value)}
                              />
                              <a 
                                  href={contractAddress ? `https://cronoscan.com/verifyContract?a=${contractAddress}` : '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`bg-moon-border hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${!contractAddress ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                  <ExternalLink size={16} /> Verify
                              </a>
                          </div>
                      </div>
                  </div>

                  <div className="relative bg-[#1e1e1e] rounded-lg border border-gray-700 p-4 font-mono text-xs overflow-auto h-64">
                      <div className="absolute top-2 right-2 text-gray-500 text-[10px] uppercase font-bold">Preview</div>
                      <pre className="text-blue-300">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
contract ${settings.symbol.replace(/[^a-zA-Z0-9]/g, '') || 'MyNFT'} is ERC721A, Ownable {
    string public baseURI = "${baseUri || 'ipfs://...' }";
    uint256 public maxSupply = ${settings.totalSupply};
    ...
}`}
                      </pre>
                  </div>
              </div>
           </div>

           {/* Step 4: Admin Dashboard */}
           <div className="bg-moon-card border border-moon-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Hammer className="text-red-400" /> 4. Admin Dashboard
              </h2>
              
              {!account ? (
                  <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">Connect your wallet to manage your deployed contract.</p>
                      <button 
                          onClick={connectWallet}
                          className="px-6 py-2 bg-moon-accent text-black rounded-lg font-bold hover:bg-sky-400 transition-colors"
                      >
                          Connect Wallet
                      </button>
                  </div>
              ) : (
                  <div className="space-y-6">
                      <div className="flex gap-4 items-end">
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Contract Address</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      placeholder="0x..."
                                      value={contractAddress}
                                      onChange={(e) => setContractAddress(e.target.value)}
                                      className="flex-1 bg-moon-bg border border-moon-border rounded-lg px-4 py-2 text-white focus:border-moon-accent focus:outline-none"
                                  />
                                  <button 
                                      onClick={loadContractData}
                                      className="bg-moon-border hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                                  >
                                      Load
                                  </button>
                              </div>
                          </div>
                      </div>

                      {contractAddress && (
                          <div className="bg-black/30 rounded-lg p-4 border border-moon-border">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-white">Contract Status</h3>
                                  {isOwner ? (
                                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">Owner Connected</span>
                                  ) : (
                                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">Not Owner</span>
                                  )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-moon-bg p-3 rounded border border-moon-border">
                                      <div className="text-xs text-gray-500 uppercase">Supply</div>
                                      <div className="text-lg font-bold text-white">{supply} / {maxSupply}</div>
                                  </div>
                                  <div className="bg-moon-bg p-3 rounded border border-moon-border">
                                      <div className="text-xs text-gray-500 uppercase">Price</div>
                                      <div className="text-lg font-bold text-white">{cost} CRO</div>
                                  </div>
                                  <div className="bg-moon-bg p-3 rounded border border-moon-border">
                                      <div className="text-xs text-gray-500 uppercase">Status</div>
                                      <div className={`text-lg font-bold ${paused ? 'text-red-400' : 'text-green-400'}`}>
                                          {paused ? 'Paused' : 'Active'}
                                      </div>
                                  </div>
                              </div>

                              {isOwner && (
                                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                                      <div className="space-y-4">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase">Controls</h4>
                                          <button 
                                              onClick={togglePause}
                                              disabled={loading}
                                              className={`w-full py-2 rounded font-bold transition-colors ${paused ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                                          >
                                              {paused ? 'Unpause Minting' : 'Pause Minting'}
                                          </button>
                                          <button 
                                              onClick={withdrawFunds}
                                              disabled={loading}
                                              className="w-full py-2 bg-moon-border hover:bg-gray-700 text-white rounded font-bold transition-colors"
                                          >
                                              Withdraw Funds
                                          </button>
                                      </div>

                                      <div className="space-y-4">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase">Updates</h4>
                                          <div className="flex gap-2">
                                              <input 
                                                  type="text" 
                                                  placeholder="New Price (CRO)"
                                                  value={newCost}
                                                  onChange={(e) => setNewCost(e.target.value)}
                                                  className="flex-1 bg-moon-bg border border-moon-border rounded px-3 py-2 text-sm text-white"
                                              />
                                              <button 
                                                  onClick={updateCost}
                                                  disabled={loading}
                                                  className="bg-moon-accent/20 hover:bg-moon-accent/30 text-moon-accent px-3 py-2 rounded text-sm font-bold"
                                              >
                                                  Set
                                              </button>
                                          </div>
                                          <div className="flex gap-2">
                                              <input 
                                                  type="text" 
                                                  placeholder="New Base URI (ipfs://...)"
                                                  value={newBaseUri}
                                                  onChange={(e) => setNewBaseUri(e.target.value)}
                                                  className="flex-1 bg-moon-bg border border-moon-border rounded px-3 py-2 text-sm text-white"
                                              />
                                              <button 
                                                  onClick={updateBaseUri}
                                                  disabled={loading}
                                                  className="bg-moon-accent/20 hover:bg-moon-accent/30 text-moon-accent px-3 py-2 rounded text-sm font-bold"
                                              >
                                                  Set
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
           </div>
        </div>
      ) : (
        /* PUBLIC MINT PAGE */
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Configuration Panel */}
            <div className="bg-moon-card p-6 rounded-xl border border-moon-border shadow-lg shadow-black/50">
                <h2 className="text-xl font-bold text-moon-text mb-4 flex items-center gap-2">
                    <ExternalLink size={20} /> Connect Contract
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="Enter deployed Contract Address (0x...)"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="flex-1 bg-moon-bg border border-moon-border rounded-lg px-4 py-3 text-moon-text focus:border-moon-accent focus:ring-1 focus:ring-moon-accent focus:outline-none transition-all"
                />
                <button 
                    onClick={loadContractData}
                    disabled={loading || !contractAddress}
                    className="bg-moon-border hover:bg-gray-700 text-moon-text px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={16} />} Load Data
                </button>
                </div>
            </div>

            {/* Minting Card */}
            <div className="bg-gradient-to-br from-moon-card to-black rounded-2xl overflow-hidden border border-moon-border shadow-2xl relative">
                {/* Decorative Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-moon-accent/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                {/* Hero Image / Banner */}
                <div className="relative h-56 bg-black overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=2342&q=80" 
                        className="w-full h-full object-cover opacity-60" 
                        alt="Night Sky" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moon-card to-transparent"></div>
                    <div className="absolute bottom-6 left-8">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">BlackMarket NFT's Mint</h1>
                        <p className="text-moon-accent font-medium mt-1">Live on Cronos Mainnet</p>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-12 relative z-10">
                    {/* Stats Column */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-moon-bg/50 border border-moon-border rounded-lg backdrop-blur-sm">
                            <span className="text-gray-400">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${paused ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                {paused ? 'Paused' : 'Live'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-moon-bg/50 border border-moon-border rounded-lg backdrop-blur-sm">
                            <span className="text-gray-400">Price per NFT</span>
                            <span className="text-xl font-bold text-white">{cost} CRO</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-3 pt-4">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-400">Mint Progress</span>
                                <span className="text-moon-accent">{Math.round((supply/maxSupply)*100) || 0}%</span>
                            </div>
                            <div className="h-4 bg-moon-bg rounded-full overflow-hidden border border-moon-border">
                                <div 
                                className="h-full bg-gradient-to-r from-moon-accent to-moon-glow shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${maxSupply > 0 ? (supply / maxSupply) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="text-center text-sm text-gray-400">
                                <span className="text-white font-bold">{supply}</span> / {maxSupply} Minted
                            </div>
                        </div>
                    </div>

                    {/* Interaction Column */}
                    <div className="flex flex-col justify-center space-y-6">
                        {!account ? (
                            <button 
                                onClick={connectWallet}
                                className="w-full py-4 bg-moon-accent hover:bg-sky-400 text-black rounded-xl font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-moon-accent/20"
                            >
                                <Wallet size={24} /> Connect Wallet
                            </button>
                        ) : (
                            <>  
                                {/* Status Messages - Success Overlay */}
                                {status === 'success' ? (
                                    <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-xl text-center space-y-4 animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle2 className="text-green-400 w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Mint Successful!</h3>
                                            <p className="text-gray-400 text-sm mt-1">Welcome to the club.</p>
                                        </div>

                                        {mintedIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 justify-center my-2">
                                            {mintedIds.map(id => (
                                                <span key={id} className="inline-flex items-center gap-1 bg-moon-accent/10 border border-moon-accent/30 text-moon-accent px-2 py-1 rounded text-xs font-bold">
                                                    <Ticket size={12} /> #{id}
                                                </span>
                                            ))}
                                        </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                                            <code className="text-xs text-gray-400 truncate flex-1 pl-2">
                                                {txHash}
                                            </code>
                                            <button onClick={copyHash} className="p-2 hover:bg-white/10 rounded transition-colors text-gray-400">
                                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            </button>
                                        </div>

                                        <div className="flex gap-3">
                                            <a 
                                            href={`https://cronoscan.com/tx/${txHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                                            >
                                                View Explorer <ExternalLink size={14} />
                                            </a>
                                            <button 
                                                onClick={() => setStatus('idle')}
                                                className="flex-1 py-2 bg-moon-accent/10 hover:bg-moon-accent/20 text-moon-accent border border-moon-accent/30 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Mint More
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Mint Controls
                                    <>
                                        <div className="flex items-center justify-center gap-4 bg-moon-bg/50 p-2 rounded-xl border border-moon-border">
                                            <button 
                                                onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                                                className="w-12 h-12 rounded-lg bg-moon-border text-white text-xl hover:bg-gray-600 transition-colors"
                                            >-</button>
                                            <span className="text-3xl font-bold text-white w-16 text-center">{mintAmount}</span>
                                            <button 
                                                onClick={() => setMintAmount(Math.min(5, mintAmount + 1))} // Cap at 5 for UI safety
                                                className="w-12 h-12 rounded-lg bg-moon-border text-white text-xl hover:bg-gray-600 transition-colors"
                                            >+</button>
                                        </div>
                                        
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-gray-400">Total Cost</span>
                                            <span className="text-2xl font-bold text-moon-accent">{Number(cost) * mintAmount} CRO</span>
                                        </div>

                                        <button 
                                            onClick={mint}
                                            disabled={paused || loading}
                                            className={`w-full py-4 rounded-xl font-bold text-lg text-black transition-all flex items-center justify-center gap-2
                                                ${paused || loading ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-moon-accent hover:bg-sky-400 active:scale-95 shadow-lg shadow-moon-accent/20'}
                                            `}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="animate-spin" /> Confirming...
                                                </>
                                            ) : 'MINT NOW'}
                                        </button>

                                        {status === 'error' && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                                <div className="flex-1">
                                                    <p className="text-red-400 text-sm font-medium">Transaction Failed</p>
                                                    <p className="text-red-400/80 text-xs mt-1">{errorMsg}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};