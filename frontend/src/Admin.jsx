import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const App = () => {
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState('')
  const [newTeam, setNewTeam] = useState('')
  const [newTournamentName, setNewTournamentName] = useState('')
  const [tournamentType, setTournamentType] = useState('group')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [teamPhoto, setTeamPhoto] = useState(null)
  const [playersInput, setPlayersInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate()

  const API_URL = '/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const storedUser = localStorage.getItem('username');
      if (storedUser) setCurrentUser(storedUser);
    }
  }, []);



  useEffect(() => {
    if (isLoggedIn) {
      fetchTournaments()
    }
  }, [isLoggedIn])

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/championships`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tournaments')
      }

      const data = await response.json()
      setTournaments(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddTeam = async () => {
    if (!selectedTournament || !newTeam.trim()) {
      alert('Válassz ki egy bajnokságot és adj meg egy csapatnevet!')
      return
    }else{
      alert('Csapat sikeresen hozzáadva a bajnoksághoz!')
    }

    const formData = new FormData()

    const playersArray = playersInput
      .split(',')
      .map((player) => player.trim())
      .filter((player) => player.length > 0)
    formData.append('name', newTeam)
    formData.append('championshipId', selectedTournament)
    formData.append('players', JSON.stringify(playersArray))
    if (teamPhoto) {
      formData.append('teamPhoto', teamPhoto)
    }

    try {
      const response = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Csapat létrehozása nem sikerült')
      }

      const data = await response.json()
      setTournaments((prev) =>
        prev.map((t) =>
          t._id === selectedTournament
            ? { ...t, teams: [...(t.teams || []), data] }
            : t
        )
      )
      setNewTeam('')
      setPlayersInput('')
      setTeamPhoto(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a csapatot?')) {
      return;
    }
  
    try {
      setDeleteLoading(true);
      const response = await fetch(`${API_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Csapat törlése nem sikerült');
      }
  
      await fetchTournaments();
    } catch (err) {
      console.error('Törlési hiba:', err);
      setError(err.message);
      alert(`Hiba történt: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };


  const handleStartTournament = async () => {
    if (!selectedTournament) {
      alert('Előbb válassz egy bajnokságot!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/championships/${selectedTournament}`);
      const tournamentData = await response.json();

      const teamCount = tournamentData.teams.length;
      const validTeamCounts = [2, 4, 8, 16, 32, 64, 128];

      if (tournamentType === 'knockout' && !validTeamCounts.includes(teamCount)) {
        alert(`A knockout típusú bajnoksághoz ${validTeamCounts.join(', ')} csapat szükséges!`);
        return;
      }

      const startResponse = await fetch(`${API_URL}/championships/${selectedTournament}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ type: tournamentType }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.text();
        throw new Error(`Hiba: ${errorData}`);
      }

      const data = await startResponse.json();
      alert('Bajnokság sikeresen elindítva!');
      navigate(`/championships/${selectedTournament}`);
    } catch (err) {
      console.error('Hiba a bajnokság indításakor:', err);
      alert(`Hiba történt: ${err.message}`);
    }
  };


  const handleCreateTournament = async () => {
    if (!newTournamentName.trim()) {
      alert('Adj meg egy bajnokságnevet!')
      return
    }

    try {
      const response = await fetch(`${API_URL}/championships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: newTournamentName, tournamentType }),
      })

      if (!response.ok) {
        throw new Error('Championship creation failed')
      }

      const data = await response.json()
      setTournaments((prev) => [...prev, data])
      setNewTournamentName('')
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedTournamentData = tournaments.find((t) => t._id === selectedTournament) || {}
  const selectedTeams = selectedTournamentData.teams || []

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: username, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', username);
      setCurrentUser(username);
      setIsLoggedIn(true)
      setUsername('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: username, password }),
      })

      if (!response.ok) {
        throw new Error('Signup failed')
      }

      const data = await response.json()
      alert('Sikeres regisztráció! Most már bejelentkezhetsz!.')
      setUsername('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setCurrentUser(null)
    setIsLoggedIn(false)
  }

  return (
    <div className='admin-login'>
      <div>
        <h1>Admin felület</h1>

        {error && <div>{error}</div>}

        {isLoggedIn ? (
          <>
            <header>
              <h2>Bajnokság app</h2>
              <p className='logout-container'>{currentUser} bejelentkezve</p>
              <button onClick={handleLogout} className='logout-button'>
                Kijelentkezés
              </button>
            </header>

            <div>
              <div className='tournament-section'>
                <h2>Válassz bajnokságot:</h2>
                <select
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                >
                  <option value=''>-- Válassz --</option>
                  {tournaments.map((t, i) => (
                    !t.isRunning &&(
                    <option key={i} value={t._id}>
                      {t.name}
                    </option>
                    )
                  ))}
                </select>
              </div>
              
              {selectedTournament && (
                <div className='tournament-section'>
                  <h2>Csapatok a(z) {selectedTournamentData.name} bajnokságban:</h2>
                  {selectedTeams.length > 0 ? (
                    <div className="teams-grid">
                      {selectedTeams.map((team, i) => (
                        <div key={i} className="team-card">
                          {team.teamPhoto && (
                            <img src={`${API_URL}/${team.teamPhoto}`} alt={`${team.name} logo`} className="team-photo" />
                          )}
                          <h3 className="team-name">{team.name}</h3>
                          <div className="players-list">
                            <strong>Játékosok:</strong>
                            <ul>
                              {team.players && team.players.map((player, index) => (
                                <li key={index}>{player}</li>
                              ))}
                            </ul>
                          </div>
                            <button 
                              onClick={() => handleDeleteTeam(team._id)} 
                              className="delete-team-button"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? 'Törlés...' : 'Csapat törlése'}
                            </button>
                        </div>
                      ))}
                    </div>                      
                  ) : (
                    <p>Nincs még csapat hozzáadva.</p>
                  )}

                  <div>
                    <h3>Új csapat hozzáadása</h3>
                    <label>Új csapat neve:</label>
                    <input
                      type='text'
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      placeholder='Pl. Fradi'
                    />
                  </div>
                  <div>
                    <label>Játékosok (vesszővel elválasztva):</label>
                    <input
                      type='text'
                      value={playersInput}
                      onChange={(e) => setPlayersInput(e.target.value)}
                      placeholder='Pl. Kovács János, Szabó Péter, Nagy László'
                    />
                  </div>
                  <div>
                    <label>Csapat fotó/logó:</label>
                    <input
                      type='file'
                      onChange={(e) => setTeamPhoto(e.target.files[0])}
                      accept='image/*'
                    />
                  </div>

                  <div>
                    <button onClick={handleAddTeam}>Csapat hozzáadása</button>
                  </div>

                  <div>
                  <label>Bajnokság típusa:</label>
                    <select
                      value={tournamentType}
                      onChange={(e) => setTournamentType(e.target.value)}
                    >
                      <option value="group">Csoportkör</option>
                      <option value="knockout">Kieséses</option>
                    </select>
                    <button onClick={handleStartTournament}>Bajnokság indítása</button>
                  </div>
                </div>
              )}
            {!selectedTournament && (
              <div className='tournament-section'>
                <label>Új bajnokság neve:</label>
                <input
                  type='text'
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  placeholder='Pl. Premier League'
                />
                <button onClick={handleCreateTournament}>Új bajnokság létrehozása</button>
              </div>)}
              <div className='tournament-section' style={{marginTop: '20px'}}>
                  <h3>Futó bajnokságok:</h3>
                  {tournaments.filter(t => t.isRunning).length > 0 ? (
                    <ul>
                      {tournaments.filter(t => t.isRunning).map((tournament, index) => (
                        <li key={index}>
                          <button onClick={() => navigate(`/championships/${tournament._id}`)} className='running-tournament-button'>
                            {tournament.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nincsenek futó bajnokságok.</p>
                  )}
                </div>
            </div>
          </>
        ) : (
          <>
            <header>
              <h2>Bajnokság app</h2>
              <button onClick={() => navigate('/')} className='header-button'>
                Vissza a főoldalra
              </button>
            </header>
            <div>
              <h2>Bejelentkezés vagy regisztráció</h2>
              <form>
                <div>
                  <label htmlFor='username'>Felhasználónév</label>
                  <input
                    type='text'
                    id='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className='login-input'
                  />
                </div>

                <div>
                  <label htmlFor='password'>Jelszó</label>
                  <input
                    type='password'
                    id='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className='login-input'
                  />
                </div>

                <div className='form-buttons'>
                  <button onClick={handleLogin} disabled={isLoading}>
                    Bejelentkezés
                  </button>
                  <button onClick={handleSignup} disabled={isLoading}>
                    Regisztráció
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
