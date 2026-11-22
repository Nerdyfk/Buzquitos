"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle2, ChevronDown, ExternalLink, LogOut, ShieldCheck } from "lucide-react";

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = "0x2105";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface WalletConnectProps {
  onAddressChange?: (address: string | null) => void;
  className?: string;
  compact?: boolean;
}

export function WalletConnect({
  onAddressChange,
  className = "",
  compact = false,
}: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync address changes to parent callback
  useEffect(() => {
    onAddressChange?.(wallet.address);
  }, [wallet.address, onAddressChange]);

  // Check if wallet was previously connected
  useEffect(() => {
    const saved = localStorage.getItem("gtd_connected_wallet");
    if (saved && /^0x[a-fA-F0-9]{40}$/.test(saved)) {
      setWallet((prev) => ({
        ...prev,
        address: saved,
        chainId: BASE_CHAIN_ID,
        isConnected: true,
      }));
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      localStorage.removeItem("gtd_connected_wallet");
      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
      });
    } else {
      const addr = accounts[0];
      localStorage.setItem("gtd_connected_wallet", addr);
      setWallet((prev) => ({
        ...prev,
        address: addr,
        isConnected: true,
      }));
    }
  }, []);

  const handleChainChanged = useCallback((hexChainId: string) => {
    const parsed = parseInt(hexChainId, 16);
    setWallet((prev) => ({ ...prev, chainId: parsed }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const eth = window.ethereum as any;
    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  async function connectInjectedWallet() {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts selected");
        }

        const chainIdHex = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;
        let currentChain = parseInt(chainIdHex, 16);

        // Prompt to switch to Base if on another chain
        if (currentChain !== BASE_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: BASE_CHAIN_ID_HEX }],
            });
            currentChain = BASE_CHAIN_ID;
          } catch (switchErr: any) {
            // Chain not added, try adding Base
            if (switchErr.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: BASE_CHAIN_ID_HEX,
                    chainName: "Base",
                    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
                ],
              });
              currentChain = BASE_CHAIN_ID;
            }
          }
        }

        const addr = accounts[0];
        localStorage.setItem("gtd_connected_wallet", addr);
        setWallet({
          address: addr,
          chainId: currentChain,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      } else {
        // Fallback for environments without browser extensions (Demo / Simulated Web3 Wallet)
        const demoAddr = "0x892" + Math.random().toString(16).slice(2, 10) + "42f" + Math.random().toString(16).slice(2, 6) + "e1c";
        const padded = (demoAddr + "0000000000000000000000000000000000000000").slice(0, 42);
        localStorage.setItem("gtd_connected_wallet", padded);
        setWallet({
          address: padded,
          chainId: BASE_CHAIN_ID,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      }
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }

  function disconnect() {
    localStorage.removeItem("gtd_connected_wallet");
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    setMenuOpen(false);
  }

  if (wallet.isConnected && wallet.address) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="flex items-center gap-2">
          {/* Base Network indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 border-2 border-[#111111] bg-[#B8E643] px-2.5 py-1 font-mono text-[11px] font-bold shadow-[2px_2px_0_#111111]">
            <span className="h-2 w-2 rounded-full bg-[#111111] animate-pulse" />
            <span>BASE</span>
          </div>

          {/* Connected Address Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-2 border-2 border-[#111111] bg-[#FEF3C7] px-3 py-1.5 font-mono text-xs font-bold text-[#111111] shadow-[3px_3px_0_#111111] transition hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
          >
            <ShieldCheck className="h-4 w-4 text-[#B8E643]" />
            <span>{truncateAddress(wallet.address)}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-56 border-2 border-[#111111] bg-[#FEF3C7] p-3 shadow-[5px_5px_0_#111111]">
            <div className="border-b border-[#111111]/20 pb-2 mb-2 font-mono text-[10px] text-[#444444]">
              CONNECTED TO BASE MAINNET
              <div className="mt-1 font-bold text-xs text-[#111111] truncate">
                {wallet.address}
              </div>
            </div>

            <a
              href={`https://basescan.org/address/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between py-1.5 text-xs font-bold text-[#111111] hover:underline"
            >
              <span>View on Basescan</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={disconnect}
              className="mt-2 w-full flex items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#e42c24] py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#111111] transition hover:opacity-90"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>DISCONNECT</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <button
        type="button"
        disabled={wallet.isConnecting}
        onClick={connectInjectedWallet}
        className="inline-flex items-center gap-2 border-2 border-[#111111] bg-[#FACC15] px-3.5 py-1.5 sm:py-2 font-mono text-xs font-bold text-[#111111] shadow-[3px_3px_0_#111111] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#B8E643] active:translate-x-0 active:translate-y-0"
      >
        <Wallet className="h-4 w-4" />
        <span>{wallet.isConnecting ? "CONNECTING..." : "CONNECT WALLET"}</span>
      </button>
      {wallet.error && (
        <span className="block mt-1 text-[10px] font-bold text-[#e42c24]">
          {wallet.error}
        </span>
      )}
    </div>
  );
}
