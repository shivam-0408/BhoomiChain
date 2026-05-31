# ⛓ BhoomiChain — Blockchain Land Registry
### College Major Project | Polygon Amoy Testnet | MetaMask | React + Solidity

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│               React Frontend (Vite)             │
│  Dashboard │ Register │ My Lands │ Map │ Admin  │
└─────────────────┬───────────────────────────────┘
                  │ ethers.js v6
┌─────────────────▼───────────────────────────────┐
│         MetaMask Wallet (Browser Extension)     │
└─────────────────┬───────────────────────────────┘
                  │ JSON-RPC
┌─────────────────▼───────────────────────────────┐
│      Polygon Amoy Testnet (Chain ID: 80002)     │
│         LandRegistry.sol Smart Contract         │
└─────────────────────────────────────────────────┘
```

---

## 🗂 Project Structure

```
land-registry/
├── contracts/
│   └── LandRegistry.sol       ← Solidity smart contract
├── scripts/
│   └── deploy.js              ← Hardhat deployment script
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RegisterLand.jsx   ← GPS map + form
│   │   ├── MyLands.jsx        ← Owner's parcels + transfer
│   │   ├── AllLands.jsx       ← Public records table
│   │   ├── LandMap.jsx        ← Leaflet GPS map of all lands
│   │   └── AdminPanel.jsx     ← Approve/reject + manage admins
│   ├── hooks/
│   │   └── useWeb3.js         ← MetaMask + contract hook
│   ├── utils/
│   │   └── contract.js        ← ABI, address, network config
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── hardhat.config.js
├── package.json
├── vite.config.js
├── index.html                 ← Leaflet CDN loaded here
└── .env.example
```

---

## 🚀 Step-by-Step Setup

### 1. Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **MetaMask** browser extension — https://metamask.io
- **MATIC test tokens** — Get free MATIC at https://faucet.polygon.technology

### 2. Install Dependencies
```bash
cd land-registry
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PRIVATE_KEY=<your MetaMask wallet private key>
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
VITE_CONTRACT_ADDRESS=   # fill this after deployment
```

> ⚠️ To get your private key: MetaMask → Account Details → Export Private Key
> Never share or commit this key!

### 4. Add Polygon Amoy to MetaMask
MetaMask will auto-prompt when you click "Connect", but you can also add manually:
| Field | Value |
|---|---|
| Network Name | Polygon Amoy Testnet |
| RPC URL | https://rpc-amoy.polygon.technology |
| Chain ID | 80002 |
| Symbol | MATIC |
| Explorer | https://amoy.polygonscan.com |

### 5. Get Test MATIC
Visit https://faucet.polygon.technology, connect your wallet, select **Amoy** and request MATIC.

### 6. Compile the Smart Contract
```bash
npm run compile
```
Expected output: `Compiled 1 Solidity file successfully`

### 7. Deploy to Polygon Amoy
```bash
npm run deploy:amoy
```
Output will look like:
```
✅ LandRegistry deployed to: 0xAbC123...
VITE_CONTRACT_ADDRESS=0xAbC123...
```

Copy the address into your `.env` file:
```
VITE_CONTRACT_ADDRESS=0xAbC123...
```

### 8. Start the Frontend
```bash
npm run dev
```
Open http://localhost:5173

---

## 🔗 Smart Contract Features

### Roles
| Role | Permissions |
|---|---|
| **Super Admin** | Contract deployer; can add/remove admins |
| **Admin** | Can approve/reject registrations and transfers |
| **User** | Can register land, request transfers |

### Land Status Flow
```
Register Land → [Pending] → Admin Approves → [Approved]
                          ↘ Admin Rejects  → [Rejected]

Approved Land → Request Transfer → [Transfer Pending] → Admin Approves → [Approved] (new owner)
                                                       ↘ Admin Rejects  → [Approved] (original owner)
```

### Key Functions
```solidity
registerLand(surveyNumber, location, area, landType, lat, lng, docHash)
approveLand(id)
rejectLand(id, reason)
requestTransfer(id, newOwnerAddress)
approveTransfer(id)
rejectTransfer(id, reason)
addAdmin(address)
```

### GPS Coordinates
Stored on-chain as integers (multiplied by 1e6) to avoid floating-point:
- `lat = 27.176700` → stored as `27176700`
- Frontend divides by 1e6 when reading

---

## 🗺 GPS Map (Leaflet)
- Leaflet is loaded via CDN in `index.html`
- Click anywhere on map while registering to pin the parcel location
- All registered parcels appear as colored dots on the public map
- Dot color = parcel status (amber=pending, green=approved, red=rejected, purple=transfer pending)

---

## 📋 Verify Contract on Polygonscan (Optional)
```bash
npx hardhat verify --network amoy <DEPLOYED_ADDRESS>
```
Add `POLYGONSCAN_API_KEY` to `.env` first (get from https://polygonscan.com/apis).

---

## 🧪 Local Testing
```bash
# Terminal 1: start local node
npm run node

# Terminal 2: deploy locally
npm run deploy:local

# Paste local address into .env as VITE_CONTRACT_ADDRESS
npm run dev
```

---

## 📦 Tech Stack
| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20 |
| Blockchain | Polygon Amoy Testnet |
| Dev Framework | Hardhat |
| Frontend | React 18 + Vite |
| Web3 Library | ethers.js v6 |
| Wallet | MetaMask |
| Map | Leaflet.js + OpenStreetMap |
| Styling | Custom CSS (dark theme) |

---

## 📝 Notes for Viva / Report
- **Decentralisation**: Land records stored on Polygon blockchain — no single point of failure
- **Immutability**: Once approved, records cannot be altered without trace
- **Transparency**: All transactions publicly verifiable on Polygonscan
- **Smart Contract**: Enforces business rules (only owner can transfer, only admin can approve)
- **GPS Integration**: Real-world coordinates stored on-chain, visualised via Leaflet
- **Gas Fees**: Polygon's low fees (~$0.001) make it practical vs Ethereum mainnet
