"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Options() {
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("Normal");
  const [hoverBack, setHoverBack] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Luetaan localStoragesta kun komponentti ladataan
  useEffect(() => {
    const storedVolume = localStorage.getItem("volume");
    const storedDifficulty = localStorage.getItem("difficulty");
    if (storedVolume) setVolume(Number(storedVolume));
    if (storedDifficulty) setDifficulty(storedDifficulty);
  }, []);

  // Tallennetaan muutokset localStorageen heti kun state muuttuu
  useEffect(() => {
    localStorage.setItem("volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("difficulty", difficulty);
  }, [difficulty]);

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
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>Options</h1>

      {/* Volume */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ fontSize: "1.5rem" }}>Volume: {volume}</p>
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
        <p style={{ fontSize: "1.5rem" }}>Difficulty</p>
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
          transition: "0.2s",
        }}
      >
        {showInfo ? "Hide Info" : "Show Info"}
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
          }}
        >
          Polar Opposites is a fun word game where you need to find the opposite of words. Adjust the volume and difficulty to your liking!
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
            transition: "0.2s",
          }}
        >
          Back
        </button>
      </Link>
    </div>
  );
}