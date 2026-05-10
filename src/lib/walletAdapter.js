const DEMO_ADDRESS = "9c4Ax01a3D7Hpk5fb3sR4nN8XzLm8wYqp";

function getProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.solana || null;
}

export function getInjectedWalletProvider() {
  return getProvider();
}

function providerName(provider) {
  if (!provider) return "Demo wallet";
  if (provider.isPhantom) return "Phantom";
  if (provider.isBackpack) return "Backpack";
  if (provider.isSolflare) return "Solflare";
  return "Solana wallet";
}

export function getConnectedInjectedWallet() {
  const provider = getProvider();
  const address = provider?.publicKey?.toString?.();

  if (!address) {
    return null;
  }

  return {
    address,
    walletName: providerName(provider),
    source: "injected",
  };
}

export async function connectWallet() {
  const provider = getProvider();

  if (!provider?.connect) {
    return {
      address: DEMO_ADDRESS,
      walletName: "Demo wallet",
      source: "demo",
    };
  }

  const response = await provider.connect();
  const address = response?.publicKey?.toString?.() || provider.publicKey?.toString?.();

  if (!address) {
    throw new Error("Wallet connected without returning a public key.");
  }

  return {
    address,
    walletName: providerName(provider),
    source: "injected",
  };
}

export async function disconnectWallet(source) {
  const provider = getProvider();

  if (source === "injected" && provider?.disconnect) {
    await provider.disconnect();
  }
}

export function shortenAddress(address) {
  if (!address) return null;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
