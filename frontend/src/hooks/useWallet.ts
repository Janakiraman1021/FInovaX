"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export const useWallet = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    const connect = async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
                const accounts = await browserProvider.send("eth_requestAccounts", []);
                setAccount(accounts[0]);
                setIsConnected(true);
                setProvider(browserProvider);
            } catch (error) {
                console.error("User rejected connection");
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    const disconnect = () => {
        setAccount(null);
        setIsConnected(false);
        setProvider(null);
    };

    return { account, isConnected, connect, disconnect };
};
