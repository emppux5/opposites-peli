"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold mb-8">My Game</h1>

        <button
          onClick={() => router.push("/game")}
          className="w-48 rounded-xl bg-blue-600 py-3 text-lg hover:bg-blue-500 transition"
        >
          Start Game
        </button>

        <button
          onClick={() => router.push("/options")}
          className="w-48 rounded-xl bg-gray-700 py-3 text-lg hover:bg-gray-600 transition"
        >
          Options
        </button>
      </div>
    </main>
  );
}