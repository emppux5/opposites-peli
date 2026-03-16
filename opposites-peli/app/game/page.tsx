'use client';
import { useState } from 'react';

const difficulty = 'normal' // pitää hakee optioneista vaikeustaso, ja sen mukaan hakea oikea botin vastausnopeus
const lang = 'fi';          // pitää hakee optioneista kieli
const words = await import(`../../data/words.${lang}.json`).then(m => m.default);

export default function GamePage() {
    const gameData = Object.entries(words) as [string, string][];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    type Status = '' | 'correct' | 'wrong';
    const [status, setStatus] = useState<Status>('');
    const currentPair = gameData[currentIndex];
    const isFinished = currentIndex >= gameData.length;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentPair) return null;

    const [question, answer] = currentPair;

    if (userInput.trim().toLowerCase() === answer.toLowerCase()) {
      setStatus('correct');
      
      // Move to next word after a brief delay
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
        setStatus('');
      }, 800);
    } else {
      setStatus('wrong');
    }
  };

  if (isFinished) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Peli loppui!</h1>
        <button onClick={() => setCurrentIndex(0)}>Pelaa uudelleen</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h1>Vastakohdat ({lang})</h1>
      
      <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
        Mikä on sanan <strong>{currentPair[0]}</strong> vastakohta?
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          autoFocus
          type="text" 
          value={userInput} 
          onChange={(e) => {
            setUserInput(e.target.value);
            if (status === 'wrong') setStatus(''); // Reset error color when typing
          }}
          style={{ 
            padding: '8px', 
            border: `2px solid ${status === 'correct' ? 'green' : status === 'wrong' ? 'red' : '#ccc'}` 
          }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Vastaa
        </button>
      </form>

      <div style={{ marginTop: '10px', height: '24px' }}>
        {status === 'correct' && <span style={{ color: 'green' }}>Oikein!</span>}
        {status === 'wrong' && <span style={{ color: 'red' }}>Väärin.</span>}
      </div>

      <p style={{ color: '#666', fontSize: '0.8rem' }}>
        Sana {currentIndex + 1} / {gameData.length}
      </p>
    </div>
  );
}