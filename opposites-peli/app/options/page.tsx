"use client"
import { useState, useEffect } from "react";
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
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("Normal");
  const [language, setLanguage] = useState<Language>("en");
  const [hoverBack, setHoverBack] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // 🔹 Ladataan asetukset
  useEffect(() => {
    const storedVolume = localStorage.getItem("volume");
    const storedDifficulty = localStorage.getItem("difficulty");
    const cookieLang = getCookie("language");

    if (storedVolume) setVolume(Number(storedVolume));
    if (storedDifficulty) setDifficulty(storedDifficulty);

    if (cookieLang === "fi" || cookieLang === "en") {
      setLanguage(cookieLang);
    }
  }, []);

  // 🔹 Tallennetaan volume & difficulty edelleen localStorageen
  useEffect(() => {
    localStorage.setItem("volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("difficulty", difficulty);
  }, [difficulty]);

  // 🔹 Tallennetaan kieli COOKIEEN
  useEffect(() => {
    setCookie("language", language);
  }, [language]);

  // 🌍 Tekstit
  const text = {
    fi: {
      options: "Asetukset",
      volume: "Äänenvoimakkuus",
      difficulty: "Vaikeustaso",
      infoBtn: showInfo ? "Piilota ohje" : "Näytä ohje",
      back: "Takaisin",
      language: "Kieli",
      info: `Etsi sanan vastakohta mahdollisimman nopeasti.
Näet ruudulla sanan.
Tehtäväsi on kirjoittaa sen vastakohta.

Esimerkki:
Kuuma → Kylmä
Iso → Pieni`
    },
    en: {
      options: "Options",
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
Big → Small`
    }
  };

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
      <div>
        <p style={{ fontSize: "1.5rem" }}>
          {text[language].language}
        </p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          style={{
            fontSize: "1.2rem",
            padding: "10px",
            borderRadius: "10px"
          }}
        >
          <option value="fi">Suomi</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Volume */}
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
          <option>Easy</option>
          <option>Normal</option>
          <option>Hard</option>
        </select>
      </div>

      {/* Info-nappi */}
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

      {/* Info teksti */}
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