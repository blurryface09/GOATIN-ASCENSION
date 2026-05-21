"use client";

/* eslint-disable @next/next/no-img-element */
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
  const [exportError, setExportError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [visualVariant, setVisualVariant] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const sessionActive = walletStatus !== "idle";

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

  const signOut = () => {
    setStage("landing");
    setWalletStatus("idle");
    setWalletAddress(null);
    setWalletMessage(null);
    setOwnedNfts([]);
    setSelectedNft(null);
    setIdentity(null);
    setUploadError(null);
    setExportError(null);
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
    setExportError(null);
    setStage("generating");
    window.setTimeout(() => {
      setIdentity(generateIdentity(selectedNft.tokenId, selectedNft.traits));
      setStage("result");
    }, 1450);
  };

  const downloadCard = async () => {
    if (!selectedNft || !identity) return;
    setExportError(null);
    setShareNotice(null);
    setIsExporting(true);
    try {
      const blob = await renderIdentityPng(selectedNft, identity);
      const link = document.createElement("a");
      link.download = `${selectedNft?.name ?? "goatin"}-ascension.png`.replace(/\s+/g, "-").toLowerCase();
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {
      setExportError("The card could not be forged as a PNG. Try Download Card again.");
    } finally {
      setIsExporting(false);
    }
  };

  const shareOnX = async () => {
    const text = getShareText(selectedNft, identity);
    setShareNotice(null);
    try {
      await navigator.clipboard.writeText(text);
      setShareNotice("Share text copied. Attach your downloaded card image in X for the full reveal.");
    } catch {
      setShareNotice("X is opening with your reveal text. Download the card and attach it to the post.");
    }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noreferrer");
  };

  const copyIdentity = async () => {
    if (!selectedNft || !identity) return;
    await navigator.clipboard.writeText(getShareText(selectedNft, identity));
    setShareNotice("Identity text copied.");
  };

  const statusCopy = getStatusCopy(walletStatus, walletMessage, ownedNfts.length);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-ash text-parchment">
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

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.34em] text-oldgold">
            <Mountain className="h-5 w-5" />
            GOATin Order
          </div>
          {sessionActive && (
            <div className="flex items-center border border-oldgold/28 bg-black/52 text-[11px] uppercase tracking-[0.16em] text-parchment/72 backdrop-blur">
              <span className="hidden border-r border-oldgold/20 px-3 py-2 sm:inline">
                {walletAddress ? shortenAddress(walletAddress) : walletStatus === "demo" ? "Demo Session" : "Wallet Session"}
              </span>
              <button onClick={signOut} className="px-3 py-2 font-black text-oldgold transition hover:text-parchment">
                Sign Out
              </button>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div
              key="landing"
              className="grid flex-1 items-center gap-6 py-10 md:grid-cols-[1.05fr_.95fr] lg:gap-10"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <div className="max-w-3xl">
                <p className="mb-4 text-xs uppercase tracking-[0.36em] text-oldgold sm:text-sm">Ascension Rite</p>
                <h1 className="font-display text-5xl font-black leading-none text-parchment drop-shadow-[0_0_28px_rgba(196,42,49,.34)] sm:text-7xl lg:text-8xl">
                  GOATin Ascension
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-parchment/78 sm:text-lg">
                  The Order reads your wallet. Choose your warrior. Begin the climb.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="gold-button group inline-flex min-h-14 items-center justify-center gap-3 px-7 text-sm font-black uppercase tracking-[0.2em] transition"
                    onClick={sessionActive ? () => setStage("gallery") : connectWallet}
                    disabled={walletStatus === "connecting" || walletStatus === "loading"}
                  >
                    <Wallet className="h-4 w-4" />
                    {walletStatus === "connecting" || walletStatus === "loading" ? "Opening Gate..." : sessionActive ? "Return to Order" : "Connect Wallet"}
                  </button>
                  <button
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/45 px-7 text-sm font-black uppercase tracking-[0.2em] text-parchment backdrop-blur transition hover:border-oldgold hover:text-white"
                    onClick={() => setStage("gallery")}
                  >
                    Enter the Order
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <WalletPanel statusCopy={statusCopy} walletStatus={walletStatus} connectWallet={connectWallet} signOut={signOut} />
            </motion.div>
          )}

          {stage === "gallery" && (
            <motion.div
              key="gallery"
              className="flex flex-1 flex-col gap-6 py-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <div className="grid gap-5 md:grid-cols-[1fr_380px] md:items-end">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.34em] text-oldgold">Wallet Gate</p>
                  <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">Choose Your GOATin</h2>
                  <p className="mt-4 max-w-2xl leading-7 text-parchment/74">
                    The Order reads your connected wallet, finds your GOATin NFTs, and lets the token itself climb.
                  </p>
                </div>
                <WalletPanel statusCopy={statusCopy} walletStatus={walletStatus} connectWallet={connectWallet} signOut={signOut} compact />
              </div>

              <div className="ink-panel p-4 backdrop-blur-md sm:p-5 lg:p-6">
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
                          className="scroll-panel mt-5 grid gap-4 p-4 md:grid-cols-[minmax(220px,.8fr)_1.2fr] md:items-center"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={transition}
                        >
                          <div className="ritual-frame relative mx-auto w-full max-w-[320px] overflow-hidden border border-black/70 bg-[radial-gradient(circle_at_50%_28%,rgba(196,42,49,.22),rgba(23,18,13,.95)_62%)] p-2">
                            <motion.img
                              src={selectedNft.image}
                              alt={selectedNft.name}
                              className="aspect-square w-full object-contain"
                              initial={{ scale: 1.08 }}
                              animate={{ scale: 1 }}
                              transition={transition}
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-crimson/10" />
                          </div>
                          <div className="flex flex-col justify-between gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-crimson">Selected Token</p>
                              <h3 className="mt-2 font-display text-3xl font-black leading-tight text-[#17120d]">{selectedNft.name}</h3>
                              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-black/55">Token #{selectedNft.tokenId}</p>
                            </div>
                            <TraitList traits={selectedNft.traits} compact />
                            <button
                              disabled={!selectedNft}
                              onClick={beginAscension}
                              className="brush-button inline-flex min-h-14 w-full items-center justify-center gap-3 px-7 text-sm font-black uppercase tracking-[0.24em] transition disabled:cursor-not-allowed disabled:opacity-50"
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
                className="ritual-frame relative mb-8 h-44 w-44 overflow-hidden border border-oldgold/50 bg-black/50 p-2 shadow-gold sm:h-52 sm:w-52"
                animate={{ y: [0, -18, 0], boxShadow: ["0 0 26px rgba(199,154,66,.28)", "0 0 58px rgba(196,42,49,.48)", "0 0 26px rgba(199,154,66,.28)"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={selectedNft.image} alt={selectedNft.name} className="h-full w-full object-contain" crossOrigin="anonymous" />
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
              className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1.02fr_.98fr]"
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
                    className="gold-button inline-flex min-h-14 items-center justify-center gap-3 px-5 text-sm font-black uppercase tracking-[0.18em] transition disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "Forging..." : "Download Card"}
                  </button>
                  <button
                    onClick={shareOnX}
                    className="brush-button inline-flex min-h-14 items-center justify-center gap-3 px-5 text-sm font-black uppercase tracking-[0.18em] transition"
                  >
                    <Share2 className="h-4 w-4" />
                    Copy + Share on X
                  </button>
                  <button
                    onClick={copyIdentity}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-oldgold/38 bg-black/46 px-5 text-sm font-black uppercase tracking-[0.18em] text-parchment backdrop-blur transition hover:border-oldgold hover:text-white"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy Identity
                  </button>
                  <button
                    onClick={() => setVisualVariant((current) => current + 1)}
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-crimson/32 bg-black/46 px-5 text-sm font-black uppercase tracking-[0.18em] text-parchment backdrop-blur transition hover:border-crimson hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Style
                  </button>
                </div>
                {exportError && (
                  <div className="border border-crimson/45 bg-crimson/12 px-4 py-3 text-sm leading-6 text-parchment">
                    {exportError}
                  </div>
                )}
                {shareNotice && (
                  <div className="border border-oldgold/35 bg-oldgold/10 px-4 py-3 text-sm leading-6 text-parchment">
                    {shareNotice}
                  </div>
                )}
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
  connectWallet,
  signOut,
  compact = false
}: {
  statusCopy: { title: string; body: string; icon: "ok" | "warn" | "load" | "wallet" };
  walletStatus: WalletStatus;
  connectWallet: () => void;
  signOut: () => void;
  compact?: boolean;
}) {
  const Icon = statusCopy.icon === "ok" ? CheckCircle2 : statusCopy.icon === "warn" ? AlertTriangle : statusCopy.icon === "load" ? Loader2 : Wallet;
  const sessionActive = walletStatus !== "idle" && walletStatus !== "connecting" && walletStatus !== "loading";

  return (
    <div className={`scroll-panel w-full p-4 ${compact ? "" : "md:max-w-md md:justify-self-end"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/50 bg-[#16110b] text-oldgold">
          <Icon className={`h-5 w-5 ${statusCopy.icon === "load" ? "animate-spin" : ""}`} />
        </div>
        <div>
          <p className="font-display text-2xl font-black leading-tight text-[#17120d]">{statusCopy.title}</p>
          <p className="mt-1 text-sm leading-6 text-black/68">{statusCopy.body}</p>
        </div>
      </div>
      <button
        onClick={sessionActive ? signOut : connectWallet}
        disabled={walletStatus === "connecting" || walletStatus === "loading"}
        className={`${sessionActive ? "brush-button" : "gold-button"} mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 px-5 text-sm font-black uppercase tracking-[0.18em] transition disabled:opacity-60`}
      >
        {sessionActive ? <X className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        {walletStatus === "connecting" || walletStatus === "loading" ? "Reading Wallet..." : sessionActive ? "Sign Out" : "Connect Wallet"}
      </button>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-parchment/14 bg-black/45 px-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-oldgold" />
      <p className="mt-5 text-sm uppercase tracking-[0.36em] text-crimson">Searching the chain</p>
      <h3 className="mt-3 font-display text-3xl font-black">Finding Your GOATin</h3>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center border border-crimson/26 bg-black/45 px-6 text-center">
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
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(180px,220px))] md:overflow-visible md:px-0">
        {nfts.map((nft) => {
          const selected = selectedNft?.id === nft.id;
          return (
            <button
              key={nft.id}
              onClick={() => onSelect(nft)}
              className={`group min-w-[180px] max-w-[220px] border bg-black/52 p-2 text-left transition hover:-translate-y-1 hover:border-oldgold/70 md:min-w-0 ${
                selected ? "border-oldgold shadow-gold ring-1 ring-crimson/55" : "border-parchment/14"
              }`}
            >
              <div className="ritual-frame overflow-hidden bg-[radial-gradient(circle_at_50%_28%,rgba(196,42,49,.18),rgba(0,0,0,.96)_64%)] p-1">
                <img src={nft.image} alt={nft.name} className="aspect-square w-full object-contain transition group-hover:scale-105" crossOrigin="anonymous" />
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
    return <p className="text-sm leading-6 text-black/58">Traits unavailable. The token ID will guide the ascension.</p>;
  }

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {shownTraits.map((trait) => (
        <div key={`${trait.trait_type}-${trait.value}`} className={compact ? "border border-black/20 bg-black/8 px-3 py-2" : "border border-black/20 bg-black/8 px-3 py-2"}>
          <p className="truncate text-[9px] uppercase tracking-[0.18em] text-black/50">{trait.trait_type}</p>
          <p className="mt-1 truncate text-sm font-bold text-[#17120d]">{trait.value}</p>
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
      <label className="group flex min-h-24 cursor-pointer items-center justify-center border border-dashed border-oldgold/35 bg-black/42 px-4 text-center transition hover:border-oldgold">
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
    const imageSrc = exportableImageSrc(nft.image);

    return (
      <div ref={ref} className="card-export scroll-panel relative mx-auto w-full max-w-[560px] overflow-hidden p-4 sm:p-6">
        <div className={`absolute inset-0 bg-gradient-to-br ${styleClass} opacity-30`} />
        <div className="absolute inset-3 border border-black/55" />
        <div className="absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-black/70 to-transparent" />
        <div className="absolute inset-x-8 bottom-5 h-px bg-gradient-to-r from-transparent via-black/70 to-transparent" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.28em] text-black/52">
            <span className="h-px flex-1 bg-black/35" />
            Ascension Writ
            <span className="h-px flex-1 bg-black/35" />
          </div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.32em] text-crimson">GOATin Ascension</p>
              <h3 className="truncate font-display text-3xl font-black leading-tight text-[#17120d]">{nft.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-black/52">Token #{nft.tokenId}</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-black/60 bg-[#17120d] font-display text-4xl text-oldgold shadow-gold">
              {identity.crest}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[.9fr_1.1fr]">
            <div className="ritual-frame border border-black/70 bg-[radial-gradient(circle_at_50%_28%,rgba(196,42,49,.2),rgba(23,18,13,.95)_62%)] p-2">
              <img src={imageSrc} alt={nft.name} className="aspect-square w-full object-contain" crossOrigin="anonymous" />
            </div>
            <div className="grid gap-2">
              {statLabels.map(([key, label]) => (
                <div key={key} className="border border-black/24 bg-black/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-black/48">{label}</p>
                  <p className="mt-1 font-display text-lg font-black text-[#17120d]">{identity[key]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border border-black/24 bg-black/8 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.26em] text-crimson">Metadata Traits</p>
            <TraitList traits={nft.traits} />
          </div>

          <div className="mt-4 border border-crimson/45 bg-[#17120d] p-4 text-parchment">
            <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-crimson">Mountain Lore</p>
            <p className="font-display text-xl font-bold leading-8 text-parchment">&ldquo;{identity.lore}&rdquo;</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/30 pt-3 text-[10px] uppercase tracking-[0.22em] text-black/52">
            <span>GOATin Order</span>
            <span>The Mountain Calls</span>
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

function getShareText(nft: OwnedGoatin | null, identity: AscensionIdentity | null) {
  if (!nft || !identity) return "My GOATin entered the Order. The Mountain Calls.";

  return `${nft.name} entered the GOATin Order.

Faction: ${identity.clan}
Aura: ${identity.aura}
Weapon: ${identity.weapon}
Role: ${identity.role}
Rank: ${identity.rank}
Corruption: ${identity.corruption}

${identity.lore}

The Mountain Calls.`;
}

function exportableImageSrc(src: string) {
  if (src.startsWith("data:") || src.startsWith("/")) return src;
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

async function renderIdentityPng(nft: OwnedGoatin, identity: AscensionIdentity) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable.");

  drawCertificateBackground(context, canvas.width, canvas.height);

  context.textAlign = "center";
  context.fillStyle = "#541114";
  context.font = "700 26px Georgia, serif";
  context.letterSpacing = "8px";
  context.fillText("GOATIN ASCENSION WRIT", 600, 92);
  context.letterSpacing = "0px";

  context.textAlign = "left";
  context.fillStyle = "#17120d";
  context.font = "900 58px Georgia, serif";
  drawWrappedText(context, nft.name, 82, 178, 760, 64, 2);

  context.font = "700 22px ui-sans-serif, system-ui";
  context.fillStyle = "rgba(23,18,13,.58)";
  context.fillText(`TOKEN #${nft.tokenId}`, 84, 274);

  context.save();
  context.beginPath();
  context.roundRect(80, 320, 430, 430, 18);
  context.clip();
  drawInkRect(context, 80, 320, 430, 430);
  const image = await loadCanvasImage(exportableImageSrc(nft.image));
  if (image) {
    drawContainedImage(context, image, 102, 342, 386, 386);
  } else {
    context.fillStyle = "#c79a42";
    context.font = "700 26px Georgia, serif";
    context.textAlign = "center";
    context.fillText("IMAGE SEALED", 295, 540);
  }
  context.restore();
  strokePanel(context, 80, 320, 430, 430, "#17120d");

  context.textAlign = "center";
  context.fillStyle = "#c79a42";
  context.font = "900 92px Georgia, serif";
  context.beginPath();
  context.arc(1000, 178, 78, 0, Math.PI * 2);
  context.fillStyle = "#17120d";
  context.fill();
  context.fillStyle = "#c79a42";
  context.fillText(identity.crest, 1000, 210);

  const stats: Array<[string, string]> = [
    ["Faction", identity.clan],
    ["Aura", identity.aura],
    ["Weapon", identity.weapon],
    ["Role", identity.role],
    ["Mountain Rank", identity.rank],
    ["Corruption", identity.corruption]
  ];

  stats.forEach(([label, value], index) => {
    const y = 320 + index * 72;
    drawParchmentCell(context, 550, y, 570, 56);
    context.textAlign = "left";
    context.fillStyle = "rgba(23,18,13,.52)";
    context.font = "700 16px ui-sans-serif, system-ui";
    context.fillText(label.toUpperCase(), 572, y + 22);
    context.fillStyle = "#17120d";
    context.font = "900 30px Georgia, serif";
    context.fillText(value, 572, y + 48);
  });

  drawParchmentCell(context, 80, 806, 1040, 210);
  context.fillStyle = "#541114";
  context.font = "700 18px ui-sans-serif, system-ui";
  context.fillText("METADATA TRAITS", 110, 852);
  nft.traits.slice(0, 8).forEach((trait, index) => {
    const x = 110 + (index % 4) * 245;
    const y = 890 + Math.floor(index / 4) * 76;
    context.fillStyle = "rgba(23,18,13,.5)";
    context.font = "700 15px ui-sans-serif, system-ui";
    context.fillText(String(trait.trait_type).toUpperCase(), x, y);
    context.fillStyle = "#17120d";
    context.font = "900 22px Georgia, serif";
    drawWrappedText(context, String(trait.value), x, y + 30, 205, 25, 1);
  });

  drawInkRect(context, 80, 1060, 1040, 250);
  context.fillStyle = "#c42a31";
  context.font = "700 18px ui-sans-serif, system-ui";
  context.fillText("MOUNTAIN LORE", 118, 1110);
  context.fillStyle = "#eadcc3";
  context.font = "900 40px Georgia, serif";
  drawWrappedText(context, `“${identity.lore}”`, 118, 1172, 960, 52, 3);

  context.textAlign = "center";
  context.fillStyle = "rgba(23,18,13,.58)";
  context.font = "700 18px ui-sans-serif, system-ui";
  context.fillText("GOATin Order   |   The Mountain Calls", 600, 1450);
  context.fillRect(180, 1488, 840, 2);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed."));
    }, "image/png");
  });
}

function drawCertificateBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#eadcc3");
  gradient.addColorStop(0.54, "#c9ad75");
  gradient.addColorStop(1, "#8f7447");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#17120d";
  context.lineWidth = 8;
  context.strokeRect(34, 34, width - 68, height - 68);
  context.lineWidth = 2;
  context.strokeRect(58, 58, width - 116, height - 116);

  for (let index = 0; index < 90; index += 1) {
    const x = (index * 97) % width;
    const y = (index * 151) % height;
    context.fillStyle = `rgba(23,18,13,${0.025 + (index % 5) * 0.006})`;
    context.beginPath();
    context.arc(x, y, 1 + (index % 4), 0, Math.PI * 2);
    context.fill();
  }
}

function drawParchmentCell(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.fillStyle = "rgba(255,248,225,.18)";
  context.fillRect(x, y, width, height);
  strokePanel(context, x, y, width, height, "rgba(23,18,13,.32)");
}

function drawInkRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#17120d");
  gradient.addColorStop(0.58, "#090807");
  gradient.addColorStop(1, "#541114");
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
}

function strokePanel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.strokeRect(x, y, width, height);
}

function drawContainedImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
    } else {
      line = testLine;
    }

    if (index === words.length - 1 && lineCount < maxLines) {
      context.fillText(line, x, y + lineCount * lineHeight);
    }
  });
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
