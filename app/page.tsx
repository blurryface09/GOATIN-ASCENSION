"use client";

/* eslint-disable @next/next/no-img-element */
import html2canvas from "html2canvas";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Clipboard,
  Download,
  Flame,
  Images,
  Loader2,
  Mountain,
  RefreshCw,
  Share2,
  ShieldCheck,
  Swords,
  Upload,
  Wallet,
  X
} from "lucide-react";
import Image from "next/image";
import { forwardRef, useMemo, useRef, useState } from "react";
import { AscensionIdentity, generateIdentity, statLabels } from "@/lib/generator";
import { demoGoatin, type NftFetchResponse, type OwnedGoatin } from "@/lib/nfts";

type Stage = "landing" | "gallery" | "generating" | "result";
type WalletStatus = "idle" | "connecting" | "loading" | "ready" | "empty" | "demo" | "error";

type EthereumProvider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const transition = { duration: 0.75, ease: [0.22, 1, 0.36, 1] };
const visualStyles = [
  "from-crimson/32 via-black/70 to-oldgold/16",
  "from-oldgold/28 via-black/75 to-crimson/18",
  "from-purple-950/38 via-black/80 to-crimson/22",
  "from-zinc-100/14 via-black/75 to-oldgold/24"
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<OwnedGoatin[]>([]);
  const [selectedNft, setSelectedNft] = useState<OwnedGoatin | null>(null);
  const [identity, setIdentity] = useState<AscensionIdentity | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [visualVariant, setVisualVariant] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 38 }, (_, index) => {
        const seed = index + 1;
        return {
          id: index,
          left: `${(seed * 37) % 100}%`,
          delay: ((seed * 13) % 50) / 10,
          duration: 5 + ((seed * 17) % 60) / 10,
          size: 2 + ((seed * 19) % 40) / 10
        };
      }),
    []
  );

  const connectWallet = async () => {
    setWalletStatus("connecting");
    setWalletMessage(null);
    setUploadError(null);
    setOwnedNfts([]);
    setSelectedNft(null);
    setIdentity(null);

    const provider = window.ethereum;
    if (!provider) {
      setWalletStatus("demo");
      setWalletMessage("No wallet found. Demo mode is open until a Base-compatible wallet is available.");
      setOwnedNfts([demoGoatin]);
      setSelectedNft(demoGoatin);
      setStage("gallery");
      return;
    }

    try {
      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      const account = accounts[0];
      if (!account) throw new Error("Wallet connection was cancelled.");

      setWalletAddress(account);
      setWalletStatus("loading");
      const response = await fetch(`/api/goatin-nfts?owner=${account}`);
      const payload = (await response.json()) as NftFetchResponse;

      if (!response.ok) throw new Error(payload.message || "The Order could not read this wallet.");

      setWalletMessage(payload.message ?? null);
      setOwnedNfts(payload.nfts);
      setSelectedNft(payload.nfts[0] ?? null);
      setWalletStatus(payload.demoMode ? "demo" : payload.nfts.length > 0 ? "ready" : "empty");
      setStage("gallery");
    } catch (error) {
      setWalletStatus("error");
      setWalletMessage(error instanceof Error ? error.message : "Wallet connection failed.");
      setStage("gallery");
    }
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("The fallback altar only accepts image files.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const probe = new globalThis.Image();
      probe.onload = () => {
        const smallestSide = Math.min(probe.naturalWidth, probe.naturalHeight);
        const ratio = probe.naturalWidth / probe.naturalHeight;

        if (smallestSide < 600 || ratio < 0.88 || ratio > 1.12) {
          setUploadError("Use a square GOATin image at least 600 x 600 for a clean ascension card.");
          return;
        }

        const manualNft: OwnedGoatin = {
          id: `manual-${Date.now()}`,
          tokenId: walletAddress ? String(Number.parseInt(walletAddress.slice(-6), 16)) : "3333",
          name: "Manual GOATin Offering",
          image: result,
          traits: [],
          source: "manual"
        };
        setOwnedNfts((current) => [manualNft, ...current.filter((nft) => nft.source !== "manual")]);
        setSelectedNft(manualNft);
      };
      probe.onerror = () => setUploadError("The Order could not read this image. Try a PNG, JPG, or WEBP file.");
      probe.src = result;
    };
    reader.readAsDataURL(file);
  };

  const beginAscension = () => {
    if (!selectedNft) return;
    setIdentity(null);
    setStage("generating");
    window.setTimeout(() => {
      setIdentity(generateIdentity(selectedNft.tokenId, selectedNft.traits));
      setStage("result");
    }, 1450);
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#090807",
        scale: 2,
        useCORS: true
      });
      const link = document.createElement("a");
      link.download = `${selectedNft?.name ?? "goatin"}-ascension.png`.replace(/\s+/g, "-").toLowerCase();
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const shareOnX = () => {
    const text =
      selectedNft && identity
        ? `${selectedNft.name} entered the GOATin Order as ${identity.role} of ${identity.clan}. ${identity.lore}`
        : "My GOATin entered the Order. The Mountain Calls.";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noreferrer");
  };

  const copyIdentity = async () => {
    if (!selectedNft || !identity) return;
    const text = `${selectedNft.name}
Faction: ${identity.clan}
Aura: ${identity.aura}
Weapon: ${identity.weapon}
Role: ${identity.role}
Rank: ${identity.rank}
Corruption: ${identity.corruption}
Lore: ${identity.lore}`;

    await navigator.clipboard.writeText(text);
  };

  const statusCopy = getStatusCopy(walletStatus, walletMessage, ownedNfts.length);

  return (
    <main className="relative min-h-screen overflow-hidden bg-ash text-parchment">
      <Image src="/images/mountain-order.png" alt="" fill priority className="pointer-events-none object-cover opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.6),rgba(7,6,5,.28)_40%,rgba(5,4,3,.96))]" />
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />
      <motion.div
        className="fog pointer-events-none absolute inset-x-[-20%] bottom-8 h-48 opacity-70"
        animate={{ x: ["-8%", "7%", "-8%"], opacity: [0.42, 0.82, 0.42] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute rounded-full bg-parchment/70"
            style={{ left: particle.left, width: particle.size, height: particle.size }}
            initial={{ y: "108vh", opacity: 0 }}
            animate={{ y: "-8vh", opacity: [0, 0.75, 0] }}
            transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.34em] text-oldgold">
            <Mountain className="h-5 w-5" />
            GOATin Order
          </div>
          {walletAddress && (
            <div className="border border-parchment/12 bg-black/42 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-parchment/70 backdrop-blur">
              {shortenAddress(walletAddress)}
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div
              key="landing"
              className="flex flex-1 flex-col justify-center pb-12 pt-20"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <div className="max-w-3xl">
                <p className="mb-5 text-sm uppercase tracking-[0.42em] text-crimson">Ascension Rite</p>
                <h1 className="font-display text-6xl font-black leading-none text-parchment drop-shadow-[0_0_28px_rgba(196,42,49,.34)] sm:text-7xl lg:text-8xl">
                  The Mountain Calls.
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-parchment/76 sm:text-lg">
                  Connect your wallet, choose a GOATin from your collection, and reveal the warrior identity sealed inside the Order.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="group inline-flex min-h-14 items-center justify-center gap-3 border border-oldgold/60 bg-oldgold px-7 text-sm font-bold uppercase tracking-[0.24em] text-black shadow-gold transition hover:bg-parchment"
                    onClick={connectWallet}
                    disabled={walletStatus === "connecting" || walletStatus === "loading"}
                  >
                    <Wallet className="h-4 w-4" />
                    {walletStatus === "connecting" || walletStatus === "loading" ? "Opening Gate..." : "Connect Wallet"}
                  </button>
                  <button
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/35 px-7 text-sm font-bold uppercase tracking-[0.24em] text-parchment backdrop-blur transition hover:border-crimson hover:text-white"
                    onClick={() => setStage("gallery")}
                  >
                    Enter the Order
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "gallery" && (
            <motion.div
              key="gallery"
              className="grid flex-1 items-center gap-7 py-8 lg:grid-cols-[.9fr_1.1fr]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <div>
                <p className="mb-4 text-sm uppercase tracking-[0.38em] text-oldgold">Wallet Gate</p>
                <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">Choose Your GOATin</h2>
                <p className="mt-5 max-w-lg leading-7 text-parchment/74">
                  The Order reads your connected wallet, finds your GOATin NFTs, and lets the token itself climb.
                </p>
                <WalletPanel statusCopy={statusCopy} walletStatus={walletStatus} connectWallet={connectWallet} />
              </div>

              <div className="border border-oldgold/28 bg-black/52 p-4 shadow-ember backdrop-blur-md sm:p-6">
                {walletStatus === "loading" || walletStatus === "connecting" ? (
                  <LoadingPanel />
                ) : (
                  <>
                    {ownedNfts.length > 0 ? (
                      <NftSelector nfts={ownedNfts} selectedNft={selectedNft} onSelect={setSelectedNft} />
                    ) : (
                      <EmptyPanel />
                    )}

                    <AnimatePresence mode="wait">
                      {selectedNft && (
                        <motion.div
                          key={selectedNft.id}
                          className="mt-5 grid gap-4 border border-parchment/14 bg-black/45 p-3 sm:grid-cols-[.9fr_1.1fr]"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={transition}
                        >
                          <div className="ritual-frame relative overflow-hidden border border-oldgold/35 bg-black/62 p-2">
                            <motion.img
                              src={selectedNft.image}
                              alt={selectedNft.name}
                              className="aspect-square w-full object-cover"
                              initial={{ scale: 1.08 }}
                              animate={{ scale: 1 }}
                              transition={transition}
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-crimson/10" />
                          </div>
                          <div className="flex flex-col justify-between gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-crimson">Selected Token</p>
                              <h3 className="mt-2 font-display text-3xl font-black text-parchment">{selectedNft.name}</h3>
                              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-parchment/52">Token #{selectedNft.tokenId}</p>
                            </div>
                            <TraitList traits={selectedNft.traits} compact />
                            <button
                              disabled={!selectedNft}
                              onClick={beginAscension}
                              className="inline-flex min-h-14 w-full items-center justify-center gap-3 border border-crimson/60 bg-crimson px-7 text-sm font-black uppercase tracking-[0.28em] text-white shadow-ember transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Ascend
                              <Flame className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(walletStatus === "empty" || walletStatus === "error" || walletStatus === "demo") && (
                      <FallbackUpload handleUpload={handleUpload} uploadError={uploadError} />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {stage === "generating" && selectedNft && (
            <motion.div
              key="generating"
              className="flex flex-1 flex-col items-center justify-center text-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={transition}
            >
              <motion.div
                className="ritual-frame relative mb-8 h-48 w-48 overflow-hidden border border-oldgold/50 bg-black/50 p-2 shadow-gold"
                animate={{ y: [0, -18, 0], boxShadow: ["0 0 26px rgba(199,154,66,.28)", "0 0 58px rgba(196,42,49,.48)", "0 0 26px rgba(199,154,66,.28)"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={selectedNft.image} alt={selectedNft.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-crimson/42 via-transparent to-oldgold/24"
                  animate={{ opacity: [0.2, 0.85, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.div>
              <p className="text-sm uppercase tracking-[0.44em] text-crimson">The Order is watching</p>
              <h2 className="mt-4 font-display text-4xl font-black sm:text-6xl">Revealing Identity</h2>
            </motion.div>
          )}

          {stage === "result" && identity && selectedNft && (
            <motion.div
              key="result"
              className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1.04fr_.96fr]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <ResultCard ref={cardRef} nft={selectedNft} identity={identity} visualVariant={visualVariant} />
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.38em] text-oldgold">Identity Sealed</p>
                <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">Your GOATin Has Ascended</h2>
                <p className="leading-7 text-parchment/72">
                  The identity is fixed to this token. You can refresh the card styling without changing faction, role, rank, or lore.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={downloadCard}
                    disabled={isExporting}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-oldgold/60 bg-oldgold px-5 text-sm font-black uppercase tracking-[0.2em] text-black shadow-gold transition hover:bg-parchment disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "Forging..." : "Download PNG"}
                  </button>
                  <button
                    onClick={shareOnX}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/42 px-5 text-sm font-black uppercase tracking-[0.2em] text-parchment backdrop-blur transition hover:border-crimson hover:text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    Share on X
                  </button>
                  <button
                    onClick={copyIdentity}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/42 px-5 text-sm font-black uppercase tracking-[0.2em] text-parchment backdrop-blur transition hover:border-oldgold hover:text-white"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy Identity
                  </button>
                  <button
                    onClick={() => setVisualVariant((current) => current + 1)}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/42 px-5 text-sm font-black uppercase tracking-[0.2em] text-parchment backdrop-blur transition hover:border-crimson hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Style
                  </button>
                </div>
                <button
                  onClick={() => {
                    setStage("gallery");
                    setIdentity(null);
                  }}
                  className="inline-flex min-h-12 items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-parchment/62 transition hover:text-parchment"
                >
                  <X className="h-4 w-4" />
                  View Another GOATin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function WalletPanel({
  statusCopy,
  walletStatus,
  connectWallet
}: {
  statusCopy: { title: string; body: string; icon: "ok" | "warn" | "load" | "wallet" };
  walletStatus: WalletStatus;
  connectWallet: () => void;
}) {
  const Icon = statusCopy.icon === "ok" ? CheckCircle2 : statusCopy.icon === "warn" ? AlertTriangle : statusCopy.icon === "load" ? Loader2 : Wallet;

  return (
    <div className="mt-7 border border-parchment/14 bg-black/45 p-4 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-oldgold/38 bg-black/50 text-oldgold">
          <Icon className={`h-5 w-5 ${statusCopy.icon === "load" ? "animate-spin" : ""}`} />
        </div>
        <div>
          <p className="font-display text-2xl font-black text-parchment">{statusCopy.title}</p>
          <p className="mt-1 text-sm leading-6 text-parchment/68">{statusCopy.body}</p>
        </div>
      </div>
      <button
        onClick={connectWallet}
        disabled={walletStatus === "connecting" || walletStatus === "loading"}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-oldgold/60 bg-oldgold px-5 text-sm font-black uppercase tracking-[0.2em] text-black shadow-gold transition hover:bg-parchment disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {walletStatus === "connecting" || walletStatus === "loading" ? "Reading Wallet..." : "Connect Wallet"}
      </button>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center border border-parchment/14 bg-black/45 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-oldgold" />
      <p className="mt-5 text-sm uppercase tracking-[0.36em] text-crimson">Searching the chain</p>
      <h3 className="mt-3 font-display text-3xl font-black">Finding Your GOATin</h3>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center border border-crimson/26 bg-black/45 px-6 text-center">
      <ShieldCheck className="h-11 w-11 text-crimson" />
      <h3 className="mt-4 font-display text-3xl font-black">No GOATin Found</h3>
      <p className="mt-3 max-w-md leading-7 text-parchment/68">No GOATin found. The Order only opens for holders.</p>
    </div>
  );
}

function NftSelector({
  nfts,
  selectedNft,
  onSelect
}: {
  nfts: OwnedGoatin[];
  selectedNft: OwnedGoatin | null;
  onSelect: (nft: OwnedGoatin) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-oldgold">Owned GOATin</p>
        <p className="text-xs uppercase tracking-[0.18em] text-parchment/52">{nfts.length} found</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {nfts.map((nft) => {
          const selected = selectedNft?.id === nft.id;
          return (
            <button
              key={nft.id}
              onClick={() => onSelect(nft)}
              className={`group min-w-[132px] border bg-black/52 p-2 text-left transition hover:-translate-y-1 hover:border-oldgold/70 ${
                selected ? "border-oldgold shadow-gold" : "border-parchment/14"
              }`}
            >
              <div className="ritual-frame overflow-hidden bg-black">
                <img src={nft.image} alt={nft.name} className="aspect-square w-full object-cover transition group-hover:scale-105" crossOrigin="anonymous" />
              </div>
              <p className="mt-2 truncate font-display text-lg font-bold text-parchment">{nft.name}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-parchment/48">#{nft.tokenId}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TraitList({ traits, compact = false }: { traits: OwnedGoatin["traits"]; compact?: boolean }) {
  const shownTraits = traits.slice(0, compact ? 4 : 10);

  if (shownTraits.length === 0) {
    return <p className="text-sm leading-6 text-parchment/54">Traits unavailable. The token ID will guide the ascension.</p>;
  }

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {shownTraits.map((trait) => (
        <div key={`${trait.trait_type}-${trait.value}`} className="border border-parchment/10 bg-black/38 px-3 py-2">
          <p className="truncate text-[9px] uppercase tracking-[0.2em] text-smoke">{trait.trait_type}</p>
          <p className="mt-1 truncate text-sm font-bold text-parchment">{trait.value}</p>
        </div>
      ))}
    </div>
  );
}

function FallbackUpload({ handleUpload, uploadError }: { handleUpload: (file?: File) => void; uploadError: string | null }) {
  return (
    <div className="mt-5 border border-parchment/14 bg-black/38 p-4">
      <div className="mb-4 flex items-start gap-3">
        <Images className="mt-1 h-5 w-5 shrink-0 text-oldgold" />
        <div>
          <p className="font-display text-2xl font-black">Fallback Offering</p>
          <p className="mt-1 text-sm leading-6 text-parchment/62">Use only when wallet fetch fails, demo mode is active, or the wallet has no GOATin.</p>
        </div>
      </div>
      <label className="group flex min-h-28 cursor-pointer items-center justify-center border border-dashed border-oldgold/35 bg-black/42 px-4 text-center transition hover:border-oldgold">
        <span className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-parchment">
          <Upload className="h-4 w-4 text-oldgold" />
          Upload GOATin Image
        </span>
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleUpload(event.target.files?.[0])} />
      </label>
      {uploadError && <div className="mt-3 border border-crimson/45 bg-crimson/12 px-4 py-3 text-sm leading-6 text-parchment">{uploadError}</div>}
    </div>
  );
}

const ResultCard = forwardRef<HTMLDivElement, { nft: OwnedGoatin; identity: AscensionIdentity; visualVariant: number }>(
  ({ nft, identity, visualVariant }, ref) => {
    const styleClass = visualStyles[visualVariant % visualStyles.length];

    return (
      <div ref={ref} className="card-export relative mx-auto w-full max-w-[580px] overflow-hidden border border-oldgold/42 p-4 shadow-ember sm:p-6">
        <div className={`absolute inset-0 bg-gradient-to-br ${styleClass}`} />
        <div className="absolute inset-0 bg-black/46" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-oldgold to-transparent" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.36em] text-oldgold">GOATin Ascension</p>
              <h3 className="truncate font-display text-3xl font-black text-parchment">{nft.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-parchment/52">Token #{nft.tokenId}</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-oldgold/55 bg-black/56 font-display text-4xl text-oldgold shadow-gold">
              {identity.crest}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[.9fr_1.1fr]">
            <div className="ritual-frame border border-parchment/18 bg-black/62 p-2">
              <img src={nft.image} alt={nft.name} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
            </div>
            <div className="grid gap-2">
              {statLabels.map(([key, label]) => (
                <div key={key} className="border border-parchment/12 bg-black/40 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-smoke">{label}</p>
                  <p className="mt-1 font-display text-lg font-bold text-parchment">{identity[key]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border border-parchment/12 bg-black/38 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-oldgold">Metadata Traits</p>
            <TraitList traits={nft.traits} />
          </div>

          <div className="mt-4 border border-crimson/32 bg-black/50 p-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-crimson">Mountain Lore</p>
            <p className="font-display text-xl font-bold leading-8 text-parchment">&ldquo;{identity.lore}&rdquo;</p>
          </div>
        </div>
      </div>
    );
  }
);

ResultCard.displayName = "ResultCard";

function getStatusCopy(status: WalletStatus, message: string | null, count: number) {
  if (status === "connecting") return { title: "Opening Wallet", body: "Approve the connection to begin the climb.", icon: "load" as const };
  if (status === "loading") return { title: "Reading Collection", body: "Searching this wallet for GOATin NFTs on Base.", icon: "load" as const };
  if (status === "ready") return { title: "Holder Verified", body: `${count} GOATin ${count === 1 ? "token" : "tokens"} found in this wallet.`, icon: "ok" as const };
  if (status === "empty") return { title: "No GOATin Found", body: "No GOATin found. The Order only opens for holders.", icon: "warn" as const };
  if (status === "demo") return { title: "Demo Mode", body: message || "No NFT API key configured. Demo mode is active.", icon: "warn" as const };
  if (status === "error") return { title: "Wallet Fetch Failed", body: message || "The Order could not read this wallet.", icon: "warn" as const };
  return { title: "Connect Wallet", body: "Connect a wallet to fetch owned GOATin NFTs and begin ascension.", icon: "wallet" as const };
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
