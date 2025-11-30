import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './Tournament_viewer.css'

function TournamentViewer() {
  const [championship, setChampionship] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const API_URL = 'http://localhost:3001'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await fetch(`${API_URL}/championships`)
        if (!resp.ok) throw new Error('Hiba a bajnokságok lekérésekor')
        const data = await resp.json()

        const runningChampionship = data.filter(champ => champ.isRunning)

        const championshipWithMatches = await Promise.all(
          runningChampionship.map(async (champ) => {
            try {
              const matchesResp = await fetch(`${API_URL}/championships/${champ._id}/matches`)
              const matches = matchesResp.ok ? await matchesResp.json() : []
              return { ...champ, matches }
            } catch {
              return { ...champ, matches: [] }
            }
          })
        )

        setChampionship(championshipWithMatches)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchData()
  }, [])

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
  
    return Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }
  
  return (
    <>
    <header>
      <h2>Bajnokság app</h2>
      <h2 style={{ fontSize: '32px', textDecoration: 'underline', fontWeight: 'bold' }}>Jelenlegi bajnokságok</h2>
      <button onClick={() => navigate('/')} className='header-button'>
        Vissza a főoldalra
      </button>
    </header>
    <div className="tournament-viewer">
      
      {error && <p className="error">{error}</p>}
      {championship.map((championship) => (
        <div className="championship-card" key={championship._id}>
          <h1>{championship.name}</h1>
          {/* <p><strong>Típus:</strong> {championship.championships_type || 'N/A'}</p> */}

          <h3>Csapatok:</h3>
          <div className="teams-grid">
            {(championship.teams || []).map((team) => (
              <div key={team._id} className="team-card">
                {team.teamPhoto && (
                  <img
                    src={`${API_URL}/${team.teamPhoto}`}
                    alt={`${team.name} logo`}
                    className="team-photo"
                  />
                )}
                <h3 className="team-name">{team.name}</h3>
                <div className="players-list">
                  <strong>Játékosok:</strong>
                  <ul>
                    {(team.players || []).map((player, index) => (
                      <li key={index}>{player}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <h3>Meccsek:</h3>
          <div className="matches-section">
            {(championship.matches || []).length > 0 ? (
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>Hazai</th>
                    <th>Eredmény</th>
                    <th>Vendég</th>
                  </tr>
                </thead>
                <tbody>
                  {championship.matches.map((match) => (
                    <tr key={match._id}>
                      <td>{match.homeTeam?.name || 'Ismeretlen'}</td>
                      <td>
                        {match.homeScore !== undefined
                          ? `${match.homeScore} - ${match.awayScore}`
                          : '(-)'}
                      </td>
                      <td>{match.awayTeam?.name || 'Ismeretlen'}</td>
                    </tr>
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
            {championship.matches.length > 0 ? (
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
                  {calculateStandings(championship.teams, championship.matches).map((team, index) => (
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

          {championship.championships_type === 'knockout' && championship.matches.length > 0 && (
            <div className="tournament-knockout-section">
              <h2>Kieséses szakasz meccsei</h2>
              {Object.keys(
                championship.matches.reduce((acc, match) => {
                  const round = match.round || 1;
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(match);
                  return acc;
                }, {})
              )
                .sort((a, b) => Number(a) - Number(b))
                .map(round => {
                  const roundMatches = championship.matches.filter(m => m.round === Number(round));
                  const roundTitle = roundMatches.length === 1 ? "Döntő" : `${round}. forduló`;

                  return (
                    <div key={round} className="tournament-knockout-round">
                      <h3>{roundTitle}</h3>
                      <div className="tournament-knockout-bracket">
                        {roundMatches.map((match, index) => (
                          <div key={index} className="tournament-knockout-match">
                            <div>{match.homeTeam?.name} vs {match.awayTeam?.name}</div>
                              <div>Eredmény: {match.homeScore !== undefined && match.awayScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'A mérkőzés még nincs lejátszva'}</div>   
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  )
}

export default TournamentViewer
