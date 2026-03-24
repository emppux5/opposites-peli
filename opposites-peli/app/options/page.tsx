"use client"
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Language = "fi" | "en";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

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

  const playTestSound = () => {
    if (dingRef.current && volume !== null) {
      dingRef.current.volume = volume / 100;
      dingRef.current.currentTime = 0;
      dingRef.current.play();
    }
  };

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

  useEffect(() => {
    if (volume !== null) {
      localStorage.setItem("volume", volume.toString());
    }
  }, [volume]);

  useEffect(() => {
    if (difficulty !== null) {
      localStorage.setItem("difficulty", difficulty);
    }
  }, [difficulty]);

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
      info: `Etsi sanan vastakohta mahdollisimman nopeasti.`,
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
      info: `Find the opposite word as quickly as possible.`,
      soundbutton: "Test Sound"
    }
  };

  if (volume === null || difficulty === null || language === null) {
    return null;
  }

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 0",
    borderBottom: "1px solid #2a2a2a"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: "bold"
  };

  // ✅ Improved select style (clear + visible)
  const selectStyle: React.CSSProperties = {
    minWidth: "180px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "2px solid #3a3a55",
    backgroundColor: "#1E1E2F",
    color: "#F0F0F0",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0F0F0F",
        color: "#F0F0F0",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "30px" }}>
        {text[language].options}
      </h1>

      {/* SETTINGS PANEL */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "#141420",
          borderRadius: "16px",
          padding: "25px 30px",
          border: "1px solid #2a2a2a",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)"
        }}
      >
        {/* LANGUAGE */}
        <div style={rowStyle}>
          <span style={labelStyle}>{text[language].language}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={selectStyle}
            onFocus={(e) => (e.currentTarget.style.border = "2px solid #6a6aff")}
            onBlur={(e) => (e.currentTarget.style.border = "2px solid #3a3a55")}
          >
            <option value="fi">Suomi</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* VOLUME */}
        <div style={rowStyle}>
          <span style={labelStyle}>
            {text[language].volume}: {volume}
          </span>

          <div style={{ minWidth: "180px", textAlign: "right" }}>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <button
              onClick={playTestSound}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#1E1E2F",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {text[language].soundbutton}
            </button>
          </div>
        </div>

        {/* DIFFICULTY */}
        <div style={rowStyle}>
          <span style={labelStyle}>{text[language].difficulty}</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={selectStyle}
            onFocus={(e) => (e.currentTarget.style.border = "2px solid #6a6aff")}
            onBlur={(e) => (e.currentTarget.style.border = "2px solid #3a3a55")}
          >
            <option>Easy</option>
            <option>Normal</option>
            <option>Hard</option>
          </select>
        </div>

        {/* MODE */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={labelStyle}>{text[language].mode}</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={selectStyle}
            onFocus={(e) => (e.currentTarget.style.border = "2px solid #6a6aff")}
            onBlur={(e) => (e.currentTarget.style.border = "2px solid #3a3a55")}
          >
            <option>Endless</option>
            <option>Challenge</option>
          </select>
        </div>
      </div>

      {/* INFO */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        style={{
          marginTop: "30px",
          fontSize: "1.2rem",
          padding: "10px 25px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          backgroundColor: "#1E1E2F",
          color: "#F0F0F0",
          cursor: "pointer",
        }}
      >
        {text[language].infoBtn}
      </button>

      {showInfo && (
        <div
          style={{
            marginTop: "15px",
            maxWidth: "600px",
            backgroundColor: "#1E1E2F",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid #333"
          }}
        >
          {text[language].info}
        </div>
      )}

      {/* BACK */}
      <Link href="/">
        <button
          onMouseEnter={() => setHoverBack(true)}
          onMouseLeave={() => setHoverBack(false)}
          style={{
            marginTop: "40px",
            fontSize: "1.3rem",
            padding: "12px 35px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: hoverBack ? "#3a3a55" : "#2E2E3F",
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