export const STANDARD_ERC721A_ABI = [
  "constructor(string memory _name, string memory _symbol, uint256 _maxSupply, uint256 _cost, string memory _baseURI)",
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

// NOTE: This is a placeholder bytecode. In a real production environment, 
// you would compile your Solidity contract (e.g., using Hardhat or Remix) 
// and paste the resulting bytecode string here.
// 
// Because we cannot run a Solidity compiler in this browser environment,
// we are providing the deployment logic but you must provide the compiled bytecode.
export const STANDARD_ERC721A_BYTECODE = "0x608060405234801561001057600080fd5b5061012f806100206000396000f3fe6080604052600436106100295760003560e01c806340c10f191461002e578063c87b56dd1461005e575b600080fd5b34801561003a57600080fd5b5061005c6004803603602081101561005157600080fd5b810190808035906020019092919050505061007e565b005b34801561006a57600080fd5b5061007c6004803603602081101561008157600080fd5b8101908080359060200190929190505050610087565b005b6000819050919050565b600081905091905056fea2646970667358221220d90f20606905596403348120690559640334812069055964033481206905596464736f6c63430008140033";
