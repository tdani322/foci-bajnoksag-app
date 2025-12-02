import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Championships.css'

const Championships = () => {
  const [championship, setChampionship] = useState(null)
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editedScores, setEditedScores] = useState({ home: '', away: '' });
  const [showModal, setShowModal] = useState(true);
  const [error, setError] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()
  const API_URL = '/api';
  


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [champRes, matchesRes] = await Promise.all([
          fetch(`${API_URL}/championships/${id}`),
          fetch(`${API_URL}/championships/${id}/matches`)
        ])

        if (!champRes.ok || !matchesRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const champData = await champRes.json()
        const matchesData = await matchesRes.json()

        setChampionship(champData)
        setMatches(matchesData)
        setTeams(champData.teams || [])
        calculateStandings(champData.teams || [], matchesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleEditClick = (match) => {
    setEditingMatchId(match._id);
    setEditedScores({
      home: match.homeScore !== undefined ? match.homeScore : '',
      away: match.awayScore !== undefined ? match.awayScore : ''
    });
  };

  const handleScoreChange = (e, field) => {
    setEditedScores({
      ...editedScores,
      [field]: e.target.value
    });
  };

  const handleSaveScore = async (matchId) => {
    if (editedScores.home === '' || editedScores.away === '') return;

    const home = parseInt(editedScores.home);
    const away = parseInt(editedScores.away);

    if (championship.championships_type === 'knockout' && home === away) {
      alert('Döntetlen eredmény nem engedélyezett kieséses rendszerben.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          homeScore: home,
          awayScore: away
        })
      });

      if (!response.ok) throw new Error('Mentés sikertelen');

      const updatedMatch = await response.json();
      const updatedMatches = matches.map(m => 
        m._id === matchId ? updatedMatch : m
      );
      
      setMatches(updatedMatches);
      calculateStandings(teams, updatedMatches);
      setEditingMatchId(null);
    } catch (error) {
      console.error('Hiba a mentés során:', error);
    }
  };

  const calculateStandings = (teams, matches) => {
    const teamStats = {}
    
    teams.forEach(team => {
      teamStats[team._id] = {
        name: team.name,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      }
    })

    matches.forEach(match => {
      if (match.homeScore !== undefined && match.awayScore !== undefined) {
        const homeTeamId = match.homeTeam.id
        const awayTeamId = match.awayTeam.id

        teamStats[homeTeamId].played++
        teamStats[awayTeamId].played++

        teamStats[homeTeamId].goalsFor += match.homeScore
        teamStats[homeTeamId].goalsAgainst += match.awayScore
        teamStats[awayTeamId].goalsFor += match.awayScore
        teamStats[awayTeamId].goalsAgainst += match.homeScore

        if (match.homeScore > match.awayScore) {
          teamStats[homeTeamId].points += 3
          teamStats[homeTeamId].wins++
          teamStats[awayTeamId].losses++
        } else if (match.homeScore < match.awayScore) {
          teamStats[awayTeamId].points += 3
          teamStats[awayTeamId].wins++
          teamStats[homeTeamId].losses++
        } else {
          teamStats[homeTeamId].points += 1
          teamStats[awayTeamId].points += 1
          teamStats[homeTeamId].draws++
          teamStats[awayTeamId].draws++
        }
      }
    })

    Object.keys(teamStats).forEach(teamId => {
      teamStats[teamId].goalDifference = 
        teamStats[teamId].goalsFor - teamStats[teamId].goalsAgainst
    })

    const standingsArray = Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })

    setStandings(standingsArray)
  }

  const generateNextRound = async () => {
  try {
    const response = await fetch(`${API_URL}/championships/${id}/next-round`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Következő forduló generálása nem sikerült');
    }

    const data = await response.json();
    setMatches(prev => [...prev, ...data.matches]);
  } catch (err) {
    setError(err.message);
  }
};

  const rounds = matches.map(m => m.round).filter(r => r !== undefined);
  const currentRound = rounds.length ? Math.max(...rounds) : 1;

  const lastRoundMatches = matches.filter(m => m.round === currentRound);
  const allCurrentRoundFinished = lastRoundMatches.every(
    m => m.homeScore !== undefined && m.awayScore !== undefined
  );

  const finishedMatches = lastRoundMatches.filter(
    m => m.homeScore !== undefined && m.awayScore !== undefined
  );

  const winners = finishedMatches.map(m => {
    if (m.isBye) return m.homeTeam?.id || null;
    return m.homeScore > m.awayScore ? m.homeTeam?.id : m.awayTeam?.id;
  }).filter(Boolean);

  const uniqueWinners = [...new Set(winners)];

  const allMatchesFinished = matches.every(
    m => m.homeScore !== undefined && m.awayScore !== undefined
  );

  const lastRoundWinners = lastRoundMatches.map(m => {
    if (m.isBye) return m.homeTeam?.id || null;
    return m.homeScore > m.awayScore ? m.homeTeam?.id : m.awayTeam?.id;
  }).filter(Boolean);

  const uniqueLastWinners = [...new Set(lastRoundWinners)];

  const isTournamentFinished = championship?.championships_type
    && allMatchesFinished
    && uniqueLastWinners.length <= 1;


  const generateMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/championships/${id}/generate-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate matches')
      }

      const data = await response.json()
      setMatches(data.matches)
    } catch (err) {
      setError(err.message)
    }
  }

  const resetChampionship = async () => {
  try {
    const response = await fetch(`${API_URL}/championships/${id}/reset`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Nem sikerült törölni a meccseket');
    }

    setMatches([]);
    setStandings([]);
  } catch (err) {
    setError(err.message);
  }
};


  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!championship) return <div>Championship not found</div>

  return (
    <div className="championships-container">
      <header>
        <h2>Bajnokság app</h2>
          <button
            onClick={() => {
              const isLoggedIn = localStorage.getItem('token') !== null;
              if (isLoggedIn) {
                navigate('/admin');
              } else {
                navigate('/admin');
              }
            }}
            className="header-button"
          >
            Vissza az adminhoz
          </button>

      </header>

      <h1>{championship.name}</h1>
      {/* <p>Típus: {championship.championships_type}</p> */}

      <div className="matches-section">
      <h2>Meccsek</h2>
      {matches.length > 0 ? (
        <table className="matches-table">
          <thead>
            <tr>
              <th>Hazai</th>
              <th>Eredmény</th>
              <th>Vendég</th>
            </tr>
          </thead>
            <tbody>
              {Object.entries(
                matches.reduce((acc, match) => {
                  const round = match.round || 1
                  if (!acc[round]) acc[round] = []
                  acc[round].push(match)
                  return acc
                }, {})
              ).sort((a, b) => a[0] - b[0])
              .map(([round, roundMatches]) => (
                <React.Fragment key={round}>
                  <tr className="round-row">
                    <td colSpan="3" className="round-header">{roundMatches.length === 1 ? '🏆 Döntő' : `${round}. forduló`}</td>
                  </tr>
                  {roundMatches.map((match) => (
                    <tr key={match._id}>
                      <td>{match.homeTeam?.name || 'Ismeretlen'}</td>
                      <td>
                        {editingMatchId === match._id ? (
                          <div className="score-edit-container">
                            <input
                              type="number"
                              min="0"
                              value={editedScores.home}
                              onChange={(e) => handleScoreChange(e, 'home')}
                              className="score-input"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              min="0"
                              value={editedScores.away}
                              onChange={(e) => handleScoreChange(e, 'away')}
                              className="score-input"
                            />
                            <button 
                              onClick={() => handleSaveScore(match._id)}
                              className="save-button"
                            >
                              Mentés
                            </button>
                            <button 
                              onClick={() => setEditingMatchId(null)}
                              className="cancel-button"
                            >
                              Mégse
                            </button>
                            <button 
                              onClick={() => navigate(`/matches/${match._id}/play`)}
                              className="play-button"
                            >
                              Mérkőzés lejátszása
                            </button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => handleEditClick(match)}
                            className="score-display"
                          >
                            {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : '(Kattints az eredmény megadásához)'}
                          </span>
                        )}
                      </td>
                      <td>{match.awayTeam?.name || 'Ismeretlen'}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>

        </table>
      ) : (
        <p>Nincsenek meccsek még.</p>
      )}
    </div>

    {championship.championships_type === 'group' && (
      <div className="standings-section">
        <h2>Tabella</h2>
        {standings.length > 0 ? (
          <table className="standings-table">
            <thead>
              <tr>
                <th>Helyezés</th>
                <th>Csapat</th>
                <th>Pont</th>
                <th>Meccs</th>
                <th>Győzelem</th>
                <th>Döntetlen</th>
                <th>Vereség</th>
                <th>Lőtt</th>
                <th>Kapott</th>
                <th>Gk</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.points}</td>
                  <td>{team.played}</td>
                  <td>{team.wins}</td>
                  <td>{team.draws}</td>
                  <td>{team.losses}</td>
                  <td>{team.goalsFor}</td>
                  <td>{team.goalsAgainst}</td>
                  <td>{team.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nincsenek eredmények még.</p>
        )}
      </div>
      )}

      {championship.championships_type === 'knockout' && matches.length > 0 && (
        <div className="knockout-section">
          <h2>Kieséses szakasz meccsei</h2>
          <div className="knockout-bracket">
            {matches.map((match, index) => (
              <div key={index} className="knockout-match">
                <div>{match.homeTeam?.name} vs {match.awayTeam?.name}</div>
                {match.homeScore !== undefined && match.awayScore !== undefined && (
                  <div>Eredmény: {match.homeScore} - {match.awayScore}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="generate-or-reset">
        {championship.championships_type === 'group' ? (
          matches.length === 0 ? (
            <button onClick={generateMatches} className="generate-button">
              Meccsek generálása
            </button>
          ) : (
            <button onClick={resetChampionship} className="reset-button">
              Bajnokság újrakezdése
            </button>
          )
        ) : (
          matches.length === 0 ? (
          <button onClick={generateMatches} className="generate-button">
            Meccsek generálása
          </button>
        ) : isTournamentFinished ? (
          <button onClick={resetChampionship} className="reset-button">
            Bajnokság újrakezdése
          </button>
        ) : !allCurrentRoundFinished ? (
          <button onClick={resetChampionship} className="reset-button">
            Bajnokság újrakezdése
          </button>
        ) : (
          <button onClick={generateNextRound} className="next-round-button">
            Következő forduló
          </button>
         )
        )}
      </div>
        {championship.championships_type === 'knockout' &&
          isTournamentFinished &&
          standings.length > 0 &&
          matches.length > 0 &&
          showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
                <h2>🎉 Bajnokság vége 🎉</h2>
                <p>A győztes csapat: <strong>{standings[0].name}</strong></p>
                <button onClick={resetChampionship} className="close-button">
                  Bajnokság újraindítása
                </button>
              </div>
            </div>
        )}

        {championship.championships_type === 'group' &&
          allMatchesFinished &&
          standings.length > 0 &&
          matches.length > 0 &&
          showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
                <h2>🎉 Bajnokság vége 🎉</h2>
                <p>A győztes csapat: <strong>{standings[0].name}</strong></p>
                <button onClick={resetChampionship} className="close-button">
                  Bajnokság újraindítása
                </button>
              </div>
            </div>
        )}
    </div>
  )
}

export default Championships