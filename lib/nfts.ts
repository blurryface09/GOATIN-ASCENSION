import type { NftTrait } from "@/lib/generator";

export type OwnedGoatin = {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  description?: string;
  traits: NftTrait[];
  source: "alchemy" | "reservoir" | "demo" | "manual";
};

export type NftFetchResponse = {
  nfts: OwnedGoatin[];
  demoMode: boolean;
  message?: string;
};

export const DEFAULT_GOATIN_CONTRACT = "0xa05173f4cf88dccea9d89447932df1a14f2e055b";

export const demoGoatin: OwnedGoatin = {
  id: "demo-777",
  tokenId: "777",
  name: "Demo GOATin #777",
  image: "/images/mountain-order.png",
  description: "Demo ascension sample for wallets without configured NFT API access.",
  traits: [
    { trait_type: "Aura", value: "Crimson Smoke" },
    { trait_type: "Head", value: "Ash Horns" },
    { trait_type: "Relic", value: "Golden Bell" },
    { trait_type: "Weapon", value: "Katana" }
  ],
  source: "demo"
};

export function normalizeImageUrl(url?: string | null) {
  if (!url) return "/images/mountain-order.png";

  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
  }

  if (url.startsWith("ar://")) {
    return `https://arweave.net/${url.replace("ar://", "")}`;
  }

  return url;
}

export function normalizeTokenId(tokenId: string | number | null | undefined) {
  if (tokenId === null || tokenId === undefined) return "0";
  const value = String(tokenId);

  if (value.startsWith("0x")) {
    return String(Number.parseInt(value, 16));
  }

  return value;
}
