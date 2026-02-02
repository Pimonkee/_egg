import React, { useEffect, useState } from 'react';
import './JasperWindow.css';
import tokens from './tokens.json';

interface JasperWindowProps {
  userFocus?: boolean;
}

const JasperWindow: React.FC<JasperWindowProps> = ({ userFocus = false }) => {
  const [humLevel, setHumLevel] = useState(0);

  useEffect(() => {
    // Hum rises gently when user focuses
    if (userFocus) {
      setHumLevel(prev => Math.min(prev + 0.1, 1));
    } else {
      setHumLevel(prev => Math.max(prev - 0.05, 0));
    }
  }, [userFocus]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="jasper-window">
      <div
        className="breathing-container"
        style={{ transform: `scale(${1 + humLevel * 0.05})` }}
      >
        <h2 style={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}>
          🥚 The Egg Breathes...
        </h2>

        <div className="token-grid">
          {tokens.map((token: any) => (
            <button
              key={token.id}
              onClick={() => speak(token.voice_output)}
              style={{
                background: 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: '1rem',
                padding: '1rem',
                fontSize: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              title={token.label}
              className="hover:scale-110"
            >
              {token.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JasperWindow;
