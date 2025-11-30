import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MatchPlay.css';

const MatchPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [matchDuration, setMatchDuration] = useState(90);
  const API_URL = 'http://localhost:3001';
  

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        if (!id || id.length !== 24 || !/^[0-9a-fA-F]+$/.test(id)) {
          throw new Error('Érvénytelen mérkőzés azonosító');
        }

        const response = await fetch(`${API_URL}/matches/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('A mérkőzés nem található');
          }
          throw new Error(`Hiba: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data._id) {
          throw new Error('Érvénytelen mérkőzés adatok');
        }

        setMatch(data);
        setScores({
          home: data.homeScore || 0,
          away: data.awayScore || 0
        });
      } catch (err) {
        console.error('Hiba a mérkőzés betöltésekor:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  useEffect(() => {
    let interval;
    if (isPlaying && time < matchDuration * 60) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (time >= matchDuration * 60) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, time, matchDuration]);

  const handleScoreChange = (team, value) => {
    setScores(prev => ({
      ...prev,
      [team]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const handleEndMatch = async () => {
    try {
      const response = await fetch(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          homeScore: scores.home,
          awayScore: scores.away
        })
      });

      if (!response.ok) throw new Error('Failed to save match result');
      
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMatchDuration(Math.max(1, Math.min(120, value)));
  };

  const handleStartMatch = () => {
    setTime(0);
    setIsPlaying(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!match) return <div>Match not found</div>;

  return (
    <>
    <header>
      <h2>Bajnokság app</h2>
      <h2>Jelenleg futó mérközés: {match.homeTeam?.name || 'Home'} vs {match.awayTeam?.name || 'Away'}</h2>
    </header>
      <div className="match-play-container">
      <div className="match-header">
      <div className="match-timer">
        {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
      </div>

        
          <div className="teams-container">
            <div className="team home-team">
              <div className="team-name">{match.homeTeam?.name || 'Home'}</div>
              <div className="team-score">
                <button 
                  className="score-btn minus" 
                  onClick={() => handleScoreChange('home', scores.home - 1)}
                >-</button>
                <span className="score-value">{scores.home}</span>
                <button 
                  className="score-btn plus" 
                  onClick={() => handleScoreChange('home', scores.home + 1)}
                >+</button>
              </div>
            </div>

            <div className="vs-separator">vs</div>

            <div className="team away-team">
              <div className="team-name">{match.awayTeam?.name || 'Away'}</div>
              <div className="team-score">
                <button 
                  className="score-btn minus" 
                  onClick={() => handleScoreChange('away', scores.away - 1)}
                >-</button>
                <span className="score-value">{scores.away}</span>
                <button 
                  className="score-btn plus" 
                  onClick={() => handleScoreChange('away', scores.away + 1)}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      <div className="duration-control">
        <label>Mérkőzés hossza (perc):</label>
        <button onClick={() => setTime(0)}>Idő nullázása</button>
        <input
          type="number"
          min="1"
          max="120"
          value={matchDuration}
          onChange={handleDurationChange}
          disabled={isPlaying}
        />
      </div>

      <div className="match-controls">
        {!isPlaying && time === 0 ? (
          <button 
            className="play-btn start"
            onClick={handleStartMatch}
          >
            Mérkőzés indítása
          </button>
        ) : (
          <>
            <button 
              className={`play-btn ${isPlaying ? 'pause' : 'play'}`}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={time >= matchDuration *60}
            >
              {isPlaying ? 'Szünet' : 'Folytatás'}
            </button>
            <button 
              className="end-match-btn"
              onClick={handleEndMatch}
              disabled={isPlaying}
            >
              Mérkőzés vége
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default MatchPlay;