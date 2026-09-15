import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 font-mono">
      <h1 className="text-3xl">geotimelapse</h1>
      <p className="text-white/60">Replay a day of geolocated events on a dark glowing map.</p>
      <Link href="/lab" className="rounded-md border border-white/30 px-4 py-2 hover:bg-white/10">
        open the lab →
      </Link>
    </main>
  );
}
