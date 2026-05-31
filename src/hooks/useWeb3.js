import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, POLYGON_AMOY } from "../utils/contract";

export function useWeb3() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectNetwork = chainId === 80002;

  const setupContract = useCallback(async (signerInstance) => {
    const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);
    setContract(c);
    return c;
  }, []);

  const switchToAmoy = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY],
        });
      }
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await switchToAmoy();
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      const c = await setupContract(web3Signer);
      const [adminStatus, superAdminAddr] = await Promise.all([
        c.isAdmin(accounts[0]),
        c.superAdmin(),
      ]);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsAdmin(adminStatus);
      setIsSuperAdmin(superAdminAddr.toLowerCase() === accounts[0].toLowerCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else window.location.reload();
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // ─── Contract Methods ─────────────────────────────────────────────────────

  // ✅ FIXED: passes object {} instead of 7 separate arguments
  const registerLand = async (data) => {
    const { surveyNumber, location, area, landType, latitude, longitude, documentHash } = data;
    const latInt = Math.round(parseFloat(latitude) * 1e6);
    const lngInt = Math.round(parseFloat(longitude) * 1e6);
    const tx = await contract.registerLand({
      surveyNumber,
      location,
      area: parseInt(area),
      landType,
      latitude: latInt,
      longitude: lngInt,
      documentHash: documentHash || ""
    });
    return tx.wait();
  };

  const approveLand = async (id) => {
    const tx = await contract.approveLand(id);
    return tx.wait();
  };

  const rejectLand = async (id, reason) => {
    const tx = await contract.rejectLand(id, reason);
    return tx.wait();
  };

  const requestTransfer = async (id, newOwner) => {
    const tx = await contract.requestTransfer(id, newOwner);
    return tx.wait();
  };

  const approveTransfer = async (id) => {
    const tx = await contract.approveTransfer(id);
    return tx.wait();
  };

  const rejectTransfer = async (id, reason) => {
    const tx = await contract.rejectTransfer(id, reason);
    return tx.wait();
  };

  const getLand = async (id) => {
    const land = await contract.getLand(id);
    return formatLand(land);
  };

  const getAllLands = async () => {
    const ids = await contract.getAllLands();
    const lands = await Promise.all(ids.map((id) => contract.getLand(id)));
    return lands.map(formatLand);
  };

  const getOwnerLands = async (address) => {
    const ids = await contract.getOwnerLands(address);
    const lands = await Promise.all(ids.map((id) => contract.getLand(id)));
    return lands.map(formatLand);
  };

  const addAdmin = async (address) => {
    const tx = await contract.addAdmin(address);
    return tx.wait();
  };

  return {
    account, provider, signer, contract,
    isAdmin, isSuperAdmin, chainId, isCorrectNetwork,
    loading, error,
    connect, disconnect, switchToAmoy,
    registerLand, approveLand, rejectLand,
    requestTransfer, approveTransfer, rejectTransfer,
    getLand, getAllLands, getOwnerLands, addAdmin,
  };
}

function formatLand(raw) {
  return {
    id: Number(raw.id),
    surveyNumber: raw.surveyNumber,
    location: raw.location,
    area: Number(raw.area),
    landType: raw.landType,
    owner: raw.owner,
    pendingOwner: raw.pendingOwner,
    status: Number(raw.status),
    latitude: Number(raw.latitude) / 1e6,
    longitude: Number(raw.longitude) / 1e6,
    registeredAt: new Date(Number(raw.registeredAt) * 1000).toLocaleDateString(),
    lastUpdatedAt: new Date(Number(raw.lastUpdatedAt) * 1000).toLocaleDateString(),
    documentHash: raw.documentHash,
  };
}