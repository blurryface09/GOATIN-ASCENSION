"use client";

/* eslint-disable @next/next/no-img-element */
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Download, Flame, Mountain, Share2, Swords, Upload, X } from "lucide-react";
import Image from "next/image";
import { forwardRef, useMemo, useRef, useState } from "react";
import { AscensionIdentity, generateIdentity, statLabels } from "@/lib/generator";

type Stage = "landing" | "upload" | "generating" | "result";

const transition = { duration: 0.75, ease: [0.22, 1, 0.36, 1] };

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [preview, setPreview] = useState<string | null>(null);
  const [identity, setIdentity] = useState<AscensionIdentity | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => {
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

  const handleUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const ascend = () => {
    if (!preview) return;
    setStage("generating");
    window.setTimeout(() => {
      setIdentity(generateIdentity());
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
      link.download = "goatin-ascension.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const shareOnX = () => {
    const text = identity
      ? `My GOATin entered the Order as ${identity.role} of ${identity.clan}. The Mountain Calls.`
      : "My GOATin entered the Order. The Mountain Calls.";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noreferrer");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ash text-parchment">
      <Image
        src="/images/mountain-order.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.58),rgba(7,6,5,.28)_42%,rgba(5,4,3,.94))]" />
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
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size
            }}
            initial={{ y: "108vh", opacity: 0 }}
            animate={{ y: "-8vh", opacity: [0, 0.75, 0] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.34em] text-oldgold">
            <Mountain className="h-5 w-5" />
            GOATin Order
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-oldgold/40 via-parchment/15 to-transparent sm:ml-8 sm:block" />
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
                  Upload your GOATin and reveal the warrior identity waiting inside the legendary Order.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="group inline-flex min-h-14 items-center justify-center gap-3 border border-oldgold/60 bg-oldgold px-7 text-sm font-bold uppercase tracking-[0.24em] text-black shadow-gold transition hover:bg-parchment"
                    onClick={() => setStage("upload")}
                  >
                    Enter the Order
                    <ArrowDown className="h-4 w-4 transition group-hover:translate-y-1" />
                  </button>
                  <button
                    className="inline-flex min-h-14 items-center justify-center gap-3 border border-parchment/18 bg-black/35 px-7 text-sm font-bold uppercase tracking-[0.24em] text-parchment backdrop-blur transition hover:border-crimson hover:text-white"
                    onClick={() => setStage("upload")}
                  >
                    Begin the Climb
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "upload" && (
            <motion.div
              key="upload"
              className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[.95fr_1.05fr]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <div>
                <p className="mb-4 text-sm uppercase tracking-[0.38em] text-oldgold">First Gate</p>
                <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">Offer Your GOATin</h2>
                <p className="mt-5 max-w-lg leading-7 text-parchment/74">
                  The frame accepts your image, then the Order reveals its clan, weapon, aura, rank, and mountain-borne lore.
                </p>
              </div>

              <div className="border border-oldgold/28 bg-black/52 p-4 shadow-ember backdrop-blur-md sm:p-6">
                <label className="ritual-frame group relative flex min-h-[360px] cursor-pointer items-center justify-center overflow-hidden border border-parchment/20 bg-black/62 transition hover:border-oldgold/70">
                  {preview ? (
                    <img src={preview} alt="Uploaded GOATin preview" className="h-full max-h-[430px] w-full object-contain p-3" />
                  ) : (
                    <div className="flex flex-col items-center px-8 text-center">
                      <Upload className="mb-5 h-12 w-12 text-oldgold" />
                      <span className="font-display text-2xl font-bold text-parchment">Choose GOATin Image</span>
                      <span className="mt-3 text-sm leading-6 text-parchment/62">PNG, JPG, or WEBP</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => handleUpload(event.target.files?.[0])}
                  />
                  <span className="pointer-events-none absolute inset-4 border border-crimson/24" />
                </label>
                <button
                  disabled={!preview}
                  onClick={ascend}
                  className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 border border-crimson/60 bg-crimson px-7 text-sm font-black uppercase tracking-[0.28em] text-white shadow-ember transition hover:bg-ember disabled:cursor-not-allowed disabled:border-parchment/10 disabled:bg-parchment/10 disabled:text-parchment/38"
                >
                  Ascend
                  <Flame className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {stage === "generating" && (
            <motion.div
              key="generating"
              className="flex flex-1 flex-col items-center justify-center text-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={transition}
            >
              <motion.div
                className="mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-oldgold/50 bg-black/50 shadow-gold"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }}
              >
                <Swords className="h-11 w-11 text-oldgold" />
              </motion.div>
              <p className="text-sm uppercase tracking-[0.44em] text-crimson">The Order is watching</p>
              <h2 className="mt-4 font-display text-4xl font-black sm:text-6xl">Revealing Identity</h2>
            </motion.div>
          )}

          {stage === "result" && identity && preview && (
            <motion.div
              key="result"
              className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1.04fr_.96fr]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={transition}
            >
              <ResultCard ref={cardRef} preview={preview} identity={identity} />
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.38em] text-oldgold">Identity Sealed</p>
                <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">Your GOATin Has Ascended</h2>
                <p className="leading-7 text-parchment/72">
                  Save the card or share the reveal on X. The screenshot carries the crest, stats, lore, and uploaded image.
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
                </div>
                <button
                  onClick={() => {
                    setStage("upload");
                    setIdentity(null);
                  }}
                  className="inline-flex min-h-12 items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-parchment/62 transition hover:text-parchment"
                >
                  <X className="h-4 w-4" />
                  Reveal Identity Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

const ResultCardBase = forwardRef<HTMLDivElement, { preview: string; identity: AscensionIdentity }>(
  ({ preview, identity }, ref) => (
    <div
      ref={ref}
      className="card-export relative mx-auto w-full max-w-[560px] overflow-hidden border border-oldgold/42 p-4 shadow-ember sm:p-6"
    >
      <div className="absolute inset-0 bg-black/54" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-oldgold to-transparent" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.36em] text-oldgold">GOATin Ascension</p>
            <h3 className="font-display text-3xl font-black text-parchment">{identity.role}</h3>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-oldgold/55 bg-black/56 font-display text-4xl text-oldgold shadow-gold">
            {identity.crest}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[.9fr_1.1fr]">
          <div className="ritual-frame border border-parchment/18 bg-black/62 p-2">
            <img src={preview} alt="Ascended GOATin" className="aspect-square w-full object-contain" />
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

        <div className="mt-4 border border-crimson/32 bg-black/50 p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-crimson">Mountain Lore</p>
          <p className="font-display text-xl font-bold leading-8 text-parchment">&ldquo;{identity.lore}&rdquo;</p>
        </div>
      </div>
    </div>
  )
);

ResultCardBase.displayName = "ResultCard";

const ResultCard = motion.create(ResultCardBase);
