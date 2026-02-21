# GenMint
This is All in one tool for any NFT project on Cronos Network Developed by Blazing_dranzer aka xtamata aka Gentleman for all crofam from BlackmoonCro Community 
This is a client-side React + Vite application that lets you generate layered NFT collections with weighted rarity, preview them, analyze trait distributions, export them, and (when fully wired) mint them on Cronos Mainnet.
Quick Overview
The app has four main tabs:
Create – Build your collection
Gallery – View and download generated NFTs
Analytics – See rarity statistics
Mint – Connect wallet and mint on-chain (admin batch mint in current version; public mint upgrade planned)
Everything runs in your browser — no server, no login, no database.
Step-by-Step Workflow
Start the App
Open http://localhost:5173 (after npm run dev)
You land on the Create tab.
Configure Collection Settings (Create tab)
Enter Collection Name (e.g. "Cyber Apes")
Enter Symbol (e.g. "CYAP")
Write a Description (shown on marketplaces)
Set Total Supply (e.g. 1000 — minimum 1)
Upload Trait Layers (Create tab)
For each default layer (Background, Body, Dress, Expression):
Drag & drop PNG/JPG files or click to upload
Recommended naming convention for rarity control:
Trait Name#weight.png
Examples:
Red Background#200.png → very common
Golden Crown#3.png → very rare
If no #weight → defaults to weight 10
Uploaded images appear as small thumbnails in the layer card
You can remove layers or upload more
Generate the Collection
Click the big Generate X NFTs button at the bottom
App runs weighted random selection for each NFT
Composites images on canvas (client-side)
Creates full metadata (name, description, attributes, image data URL)
Shows loading state
When finished → collection is stored in memory → auto-switches to Gallery tab
Browse & Download Singles (Gallery tab)
See grid of all generated NFTs
Each card shows:
1000×1000 preview
Name (#0001 format)
Token ID badge
Trait pills (first few traits)
Download button (single full-res PNG)
Search bar filters live by name or trait value
Rare/legendary NFTs may have special highlights
Analyze Rarity (Analytics tab)
One bar chart per trait type (Background, Body, etc.)
Shows trait name, count, and percentage
Sorted from most common → rarest
Helps verify your rarity distribution is balanced
Export the Entire Collection
Click Export ZIP in top nav (appears after generation)
Creates nft-collection.zip containing:
images/0001.png, 0002.png, … (full composites)
metadata/0001.json, 0002.json, … (ERC-721 compatible JSONs)
Ready to upload to IPFS or use for minting
Mint on Cronos Mainnet (Mint tab)
Current state (admin batch mint):
Click Connect Wallet (MetaMask)
Auto-switches to Cronos if needed
Shows connected address and collection size
Click Mint Collection → (if wired):
Uploads metadata to NFT.Storage (IPFS)
Deploys ERC-721 contract
Batch-mints all tokens to your wallet
Shows contract address + tx links
Limitations right now:
Mint button may only show UI (depends on wiring in code)
Requires CRO for gas
Private keys are handled 100% by your wallet — never entered or stored in app
Future public mint vision (community can mint):
Separate public page
Real-time supply/price/phase display
Quantity selector
Individual or small-batch mints
Whitelist support, countdowns, sold-out handling
Summary – Full User Flow (One Run)
Open app → Create tab
Set name, symbol, supply, description
Upload traits for each layer (use #weight for rarity)
Click Generate → wait → collection created in memory
Gallery tab → browse, search, download singles
Analytics tab → check rarity charts
Export ZIP anytime after generation
Mint tab → connect wallet → batch mint to your wallet (admin)
(future: public users visit and mint individually)
Important Notes
All generation and preview is client-side — nothing is saved unless you export ZIP
Minting requires Cronos Mainnet + CRO for gas
Private keys are never handled by the app — your wallet signs everything
For public minting upgrade: future version will add a separate /mint route with user-facing minting (individual purchases, phases, etc.)
Enjoy building your collection!
