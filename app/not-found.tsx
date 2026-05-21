import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ash px-6 text-center text-parchment">
      <p className="text-sm uppercase tracking-[0.38em] text-oldgold">Lost on the Mountain</p>
      <h1 className="mt-4 font-display text-5xl font-black">Path Not Found</h1>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center border border-oldgold/60 bg-oldgold px-6 text-sm font-black uppercase tracking-[0.22em] text-black"
      >
        Return to the Order
      </Link>
    </main>
  );
}
