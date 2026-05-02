import React from "react";
import {
  connectWallet,
  disconnectWallet,
  getConnectedInjectedWallet,
  shortenAddress,
} from "../../lib/walletAdapter";

let walletState = {
  address: null,
  walletName: "Demo wallet",
  source: "none",
  connecting: false,
  error: null,
};
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return walletState;
}

function setWalletState(nextState) {
  walletState = {
    ...walletState,
    ...nextState,
  };
  notify();
}

export default function useWallet() {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    const injected = getConnectedInjectedWallet();
    if (injected) {
      setWalletState({ ...injected, error: null });
    }
  }, []);

  const connect = React.useCallback(() => {
    setWalletState({ connecting: true, error: null });
    connectWallet()
      .then((nextWallet) => {
        setWalletState({ ...nextWallet, connecting: false, error: null });
      })
      .catch((error) => {
        setWalletState({
          connecting: false,
          error: error instanceof Error ? error.message : "Wallet connection failed.",
        });
      });
  }, []);

  const disconnect = React.useCallback(() => {
    disconnectWallet(walletState.source)
      .catch(() => {})
      .finally(() => {
        setWalletState({
          address: null,
          walletName: "Demo wallet",
          source: "none",
          connecting: false,
          error: null,
        });
      });
  }, []);

  return {
    connected: Boolean(state.address),
    address: state.address,
    short: shortenAddress(state.address),
    walletName: state.walletName,
    source: state.source,
    connecting: state.connecting,
    error: state.error,
    connect,
    disconnect,
  };
}
