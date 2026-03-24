"use client"
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Language = "fi" | "en";

// 🍪 SET COOKIE
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

// 🍪 GET COOKIE
function getCookie(name: string) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return value;
  }
  return null;
}

export default function Options() {
  const [volume, setVolume] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const [hoverBack, setHoverBack] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const dingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    dingRef.current = new Audio("/sounds/bell.ogg");
  }, []);

  // 🔊 TEST SOUND FUNCTION
  const playTestSound = () => {
    if (dingRef.current && volume !== null) {
      dingRef.current.volume = volume / 100;
      dingRef.current.currentTime = 0;
      dingRef.current.play();
    }
  };

  // 🔹 Ladataan asetukset
  useEffect(() => {
    const storedVolume = localStorage.getItem("volume");
    const storedDifficulty = localStorage.getItem("difficulty");
    const cookieLang = getCookie("language");
    const storedMode = localStorage.getItem("mode");

    setVolume(storedVolume ? Number(storedVolume) : 50);
    setDifficulty(storedDifficulty || "Normal");
    setMode(storedMode || "endless");

    if (cookieLang === "fi" || cookieLang === "en") {
      setLanguage(cookieLang);
    } else {
      setLanguage("en");
    }
  }, []);

  // 🔹 Tallennetaan volume
  useEffect(() => {
    if (volume !== null) {
      localStorage.setItem("volume", volume.toString());
    }
  }, [volume]);

  // 🔹 Tallennetaan difficulty
  useEffect(() => {
    if (difficulty !== null) {
      localStorage.setItem("difficulty", difficulty);
    }
  }, [difficulty]);

  // 🔹 Tallennetaan kieli cookieen
  useEffect(() => {
    if (language) {
      setCookie("language", language);
    }
  }, [language]);

  useEffect(() => {
    if (mode) {
      localStorage.setItem("mode", mode);
    }
  }, [mode]);

  const text = {
    fi: {
      options: "Asetukset",
      volume: "Äänenvoimakkuus",
      difficulty: "Vaikeustaso",
      mode: "Pelimuoto",
      infoBtn: showInfo ? "Piilota ohje" : "Näytä ohje",
      back: "Takaisin",
      language: "Kieli",
      info: `Etsi sanan vastakohta mahdollisimman nopeasti.
Näet ruudulla sanan.
Tehtäväsi on kirjoittaa sen vastakohta.

Esimerkki:
Kuuma → Kylmä
Iso → Pieni`,
      soundbutton: "Testaa ääni"
    },
    en: {
      options: "Options",
      mode: "Game Mode",
      volume: "Volume",
      difficulty: "Difficulty",
      infoBtn: showInfo ? "Hide Info" : "Show Info",
      back: "Back",
      language: "Language",
      info: `Find the opposite word as quickly as possible.
You will see a word on the screen.
Your task is to type its opposite.

Example:
Hot → Cold
Big → Small`,
      soundbutton: "Test Sound"
    }
  };

  if (volume === null || difficulty === null || language === null) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#1E1E2F",
        color: "#F0F0F0",
        fontFamily: "Arial, sans-serif",
        gap: "30px",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
        {text[language].options}
      </h1>

      {/* 🌍 LANGUAGE */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "8px" }}>
          {text[language].language}
        </p>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          style={{
            fontSize: "1.2rem",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "2px solid #FF6B6B",
            backgroundColor: "#2E2E3F",
            color: "#FFFFFF",
            cursor: "pointer",
            outline: "none",
            fontWeight: "bold",
          }}
        >
          <option value="fi">Suomi</option>
          <option value="en">English</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ fontSize: "1.5rem" }}>
          {text[language].volume}: {volume}
        </p>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: "300px", height: "10px", accentColor: "#FF6B6B" }}
        />
        <button
          onClick={playTestSound}
          style={{
            marginTop: "15px",
            fontSize: "1rem",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "2px solid #FF6B6B",
            backgroundColor: "#2E2E3F",
            color: "#F0F0F0",
            cursor: "pointer",
          }}
        >
          {text[language].soundbutton}
        </button>
      </div>

      {/* Difficulty */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ fontSize: "1.5rem" }}>
          {text[language].difficulty}
        </p>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{
            fontSize: "1.2rem",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "2px solid #FF6B6B",
            backgroundColor: "#2E2E3F",
            color: "#F0F0F0",
            cursor: "pointer",
          }}
        >
          <option>Testing</option>
          <option>Easy</option>
          <option>Normal</option>
          <option>Hard</option>
        </select>
      </div>

      {/* Mode */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ fontSize: "1.5rem" }}>
          {text[language].mode}
        </p>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            fontSize: "1.2rem",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "2px solid #FF6B6B",
            backgroundColor: "#2E2E3F",
            color: "#F0F0F0",
            cursor: "pointer",
          }}
        >
          <option>Endless</option>
          <option>Challenge</option>
        </select>
      </div>

      {/* Info */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        style={{
          fontSize: "1.3rem",
          padding: "10px 25px",
          borderRadius: "12px",
          border: "2px solid #FF6B6B",
          backgroundColor: "#2E2E3F",
          color: "#F0F0F0",
          cursor: "pointer",
        }}
      >
        {text[language].infoBtn}
      </button>

      {showInfo && (
        <div
          style={{
            maxWidth: "600px",
            backgroundColor: "#2E2E3F",
            padding: "20px",
            borderRadius: "15px",
            textAlign: "center",
            fontSize: "1.2rem",
            whiteSpace: "pre-line"
          }}
        >
          {text[language].info}
        </div>
      )}

      {/* Back */}
      <Link href="/">
        <button
          onMouseEnter={() => setHoverBack(true)}
          onMouseLeave={() => setHoverBack(false)}
          style={{
            fontSize: "1.5rem",
            padding: "15px 40px",
            borderRadius: "15px",
            border: "none",
            backgroundColor: hoverBack ? "#FF8787" : "#FF6B6B",
            color: "#F0F0F0",
            cursor: "pointer",
          }}
        >
          {text[language].back}
        </button>
      </Link>
    </div>
  );
}