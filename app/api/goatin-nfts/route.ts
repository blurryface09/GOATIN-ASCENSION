import { NextResponse } from "next/server";
import { DEFAULT_GOATIN_CONTRACT, demoGoatin, normalizeImageUrl, normalizeTokenId, type NftFetchResponse, type OwnedGoatin } from "@/lib/nfts";
import type { NftTrait } from "@/lib/generator";

export const dynamic = "force-dynamic";

type AlchemyNft = {
  tokenId?: string;
  name?: string;
  title?: string;
  description?: string;
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
  };
  raw?: {
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
      attributes?: NftTrait[];
    };
  };
  contract?: {
    address?: string;
  };
};

type ReservoirToken = {
  token?: {
    tokenId?: string;
    name?: string;
    description?: string;
    image?: string;
    media?: string;
    attributes?: NftTrait[];
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const contract = process.env.NEXT_PUBLIC_GOATIN_CONTRACT_ADDRESS || DEFAULT_GOATIN_CONTRACT;

  if (!owner || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return NextResponse.json<NftFetchResponse>(
      { nfts: [], demoMode: false, message: "A valid wallet address is required." },
      { status: 400 }
    );
  }

  try {
    if (process.env.ALCHEMY_API_KEY) {
      const nfts = await fetchFromAlchemy(owner, contract, process.env.ALCHEMY_API_KEY);
      return NextResponse.json<NftFetchResponse>({ nfts, demoMode: false });
    }

    if (process.env.RESERVOIR_API_KEY || process.env.RESERVOIR_API_BASE_URL) {
      const nfts = await fetchFromReservoir(owner, contract, process.env.RESERVOIR_API_KEY);
      return NextResponse.json<NftFetchResponse>({ nfts, demoMode: false });
    }

    return NextResponse.json<NftFetchResponse>({
      nfts: [demoGoatin],
      demoMode: true,
      message: "No NFT API key configured. Demo mode is active."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NFT fetch failed.";
    return NextResponse.json<NftFetchResponse>(
      {
        nfts: [demoGoatin],
        demoMode: true,
        message: `${message} Demo mode is active.`
      },
      { status: 200 }
    );
  }
}

async function fetchFromAlchemy(owner: string, contract: string, apiKey: string) {
  const nfts: OwnedGoatin[] = [];
  let pageKey: string | undefined;

  do {
    const url = new URL(`https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`);
    url.searchParams.set("owner", owner);
    url.searchParams.append("contractAddresses[]", contract);
    url.searchParams.set("withMetadata", "true");
    url.searchParams.set("pageSize", "100");
    if (pageKey) url.searchParams.set("pageKey", pageKey);

    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Alchemy could not fetch GOATin NFTs.");

    const payload = (await response.json()) as { ownedNfts?: AlchemyNft[]; pageKey?: string };
    nfts.push(...(payload.ownedNfts ?? []).map(mapAlchemyNft));
    pageKey = payload.pageKey;
  } while (pageKey && nfts.length < 3333);

  return nfts;
}

async function fetchFromReservoir(owner: string, contract: string, apiKey?: string) {
  const nfts: OwnedGoatin[] = [];
  let continuation: string | undefined;
  const baseUrl = process.env.RESERVOIR_API_BASE_URL || "https://api-base.reservoir.tools";

  do {
    const url = new URL(`/users/${owner}/tokens/v10`, baseUrl);
    url.searchParams.set("collection", contract);
    url.searchParams.set("limit", "100");
    url.searchParams.set("includeAttributes", "true");
    if (continuation) url.searchParams.set("continuation", continuation);

    const response = await fetch(url, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
      next: { revalidate: 60 }
    });
    if (!response.ok) throw new Error("Reservoir could not fetch GOATin NFTs.");

    const payload = (await response.json()) as { tokens?: ReservoirToken[]; continuation?: string };
    nfts.push(...(payload.tokens ?? []).map(mapReservoirNft));
    continuation = payload.continuation;
  } while (continuation && nfts.length < 3333);

  return nfts;
}

function mapAlchemyNft(nft: AlchemyNft): OwnedGoatin {
  const tokenId = normalizeTokenId(nft.tokenId);
  const metadata = nft.raw?.metadata;

  return {
    id: `alchemy-${tokenId}`,
    tokenId,
    name: nft.name || nft.title || metadata?.name || `GOATin #${tokenId}`,
    description: nft.description || metadata?.description,
    image: normalizeImageUrl(nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.originalUrl || metadata?.image),
    traits: normalizeTraits(metadata?.attributes),
    source: "alchemy"
  };
}

function mapReservoirNft(item: ReservoirToken): OwnedGoatin {
  const token = item.token ?? {};
  const tokenId = normalizeTokenId(token.tokenId);

  return {
    id: `reservoir-${tokenId}`,
    tokenId,
    name: token.name || `GOATin #${tokenId}`,
    description: token.description,
    image: normalizeImageUrl(token.image || token.media),
    traits: normalizeTraits(token.attributes),
    source: "reservoir"
  };
}

function normalizeTraits(traits?: NftTrait[]) {
  return (traits ?? [])
    .filter((trait) => trait?.trait_type && trait.value !== undefined && trait.value !== null)
    .map((trait) => ({
      trait_type: String(trait.trait_type),
      value: trait.value
    }));
}
