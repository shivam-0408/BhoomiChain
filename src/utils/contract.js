// After deploying, paste your contract address here or set VITE_CONTRACT_ADDRESS in .env
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xYourDeployedContractAddress";

export const POLYGON_AMOY = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

export const CONTRACT_ABI = [
  // Admin
  "function superAdmin() view returns (address)",
  "function admins(address) view returns (bool)",
  "function addAdmin(address _admin) external",
  "function removeAdmin(address _admin) external",
  "function isAdmin(address _addr) view returns (bool)",

  // Registration — tuple input matches LandInput struct in contract
  "function registerLand((string surveyNumber, string location, uint256 area, string landType, int256 latitude, int256 longitude, string documentHash) input) external returns (uint256)",

  // Approval
  "function approveLand(uint256 _id) external",
  "function rejectLand(uint256 _id, string _reason) external",

  // Transfer
  "function requestTransfer(uint256 _id, address _newOwner) external",
  "function approveTransfer(uint256 _id) external",
  "function rejectTransfer(uint256 _id, string _reason) external",

  // Views
  "function getLand(uint256 _id) view returns (tuple(uint256 id, string surveyNumber, string location, uint256 area, string landType, address owner, address pendingOwner, uint8 status, int256 latitude, int256 longitude, uint256 registeredAt, uint256 lastUpdatedAt, string documentHash, bool exists))",
  "function getOwnerLands(address _owner) view returns (uint256[])",
  "function getAllLands() view returns (uint256[])",
  "function getTotalLands() view returns (uint256)",
  "function transferRequests(uint256) view returns (uint256 landId, address from, address to, uint256 requestedAt, bool adminApproved)",

  // Events
  "event LandRegistered(uint256 indexed id, address indexed owner, string surveyNumber)",
  "event LandApproved(uint256 indexed id, address indexed admin)",
  "event LandRejected(uint256 indexed id, address indexed admin, string reason)",
  "event TransferRequested(uint256 indexed id, address indexed from, address indexed to)",
  "event TransferApproved(uint256 indexed id, address indexed newOwner)",
  "event TransferRejected(uint256 indexed id, string reason)",
];

export const LAND_STATUS = {
  0: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  1: { label: "Approved", color: "#10b981", bg: "#d1fae5" },
  2: { label: "Rejected", color: "#ef4444", bg: "#fee2e2" },
  3: { label: "Transfer Pending", color: "#6366f1", bg: "#ede9fe" },
};