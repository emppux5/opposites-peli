"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Language = "fi" | "en";

// 🍪 GET COOKIE
function getCookie(name: string) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return value;
  }
  return null;
}

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("Normal");
  const [mode, setMode] = useState("endless"); // "endless" tai "challenge"


  // 🔹 LUE asetukset
  useEffect(() => {
    const lang = getCookie("language");
    const vol = localStorage.getItem("volume");
    const diff = localStorage.getItem("difficulty");
    const mode = localStorage.getItem("mode"); // joko, peli jatkuu loputtomiin tai loppuu siihen että botti voittaa kerran


    if (lang === "fi" || lang === "en") {
      setLanguage(lang);
    }

    if (vol) setVolume(Number(vol));
    if (diff) setDifficulty(diff);
    if (mode) setMode(mode);
  }, []);

  // 🌍 Tekstit
  const text = {
    fi: {
      title: "Polar Opposites",
      start: "Aloita peli",
      options: "Asetukset",
      volume: "Äänenvoimakkuus",
      difficulty: "Vaikeustaso",
      mode: "Pelimuoto",
    },
    en: {
      title: "My Game",
      start: "Start Game",
      options: "Options",
      volume: "Volume",
      difficulty: "Difficulty",
      mode: "Game Mode",
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-6">
        
        <h1 className="text-4xl font-bold mb-4">
          {text[language].title}
        </h1>

        {/* 👇 Näyttää nykyiset asetukset */}
        <p>
          {text[language].volume}: {volume}
        </p>
        <p>
          {text[language].difficulty}: {difficulty}
        </p>
        <p>
          {text[language].mode}: {mode}
        </p>

        <button
          onClick={() => router.push("/game")}
          className="w-48 rounded-xl bg-blue-600 py-3 text-lg hover:bg-blue-500 transition"
        >
          {text[language].start}
        </button>

        <button
          onClick={() => router.push("/options")}
          className="w-48 rounded-xl bg-gray-700 py-3 text-lg hover:bg-gray-600 transition"
        >
          {text[language].options}
        </button>
      </div>
    </main>
  );
}