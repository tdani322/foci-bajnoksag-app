import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Admin from './Admin'
import Championships from './Championships'
import MatchPlay from './MatchPlay'
import TournamentViewer from './Tournament_viewer'
import './App.css'

function App() {
  return (
    <Router>
      <div>
        <header>
          <h2>Bajnokság app</h2>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/championships/:id" element={<Championships />} />
            <Route path="/matches/:id/play" element={<MatchPlay />} />
            <Route path="/tournaments" element={<TournamentViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Home() {
  const [status, setStatus] = useState()
  const [error, setError] = useState()
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()


  useEffect(() => {
    const getData = async () => {
      try {
        const resp = await fetch('/api/heartbeat')
        if (!resp.ok) {
          throw new Error('Wrong response')
        }
        const data = await resp.json()
        setStatus(data.connection)
      } catch (error) {
        setStatus('error')
        setError(error.message)
      }
    }
    if (showModal) {
      getData()
    }
  }, [showModal])

  const getStatus = () => {
    switch (status) {
      case 'ok':
        return 'green'
      case 'error':
        return 'red'
      default:
        return 'yellow'
    }
  }

  const handleAdminLogin = () => {
    navigate('/admin')
  }

  const handleTrackTournament = () => {
    navigate('/tournaments')
  }

  const handleToggleModal = () => {
    setShowModal((prev) => !prev)
  }

  const newsItems = [
  {
    title: "A Dortmundot legyőzve hoditótta el a BL serleget a Real Madrid!",
    text: "Veszélyesebben kezdte a mérkőzést a német csapat, de az első madridi gól után minden összeomlott. 2-0 lett a vége, így ez volt a 15. alkalom, hogy a spanyol királyi gárda játékosai magasba emelhették a trófeát a Wembley-ben aratott győzelem után.",
    img: "/news_images/Cl2024.png",
    href:"https://nepszava.hu/3237567_real-madrid-borussia-dortmund-bajnokok-ligaja-labdarugas"
  },
  {
    title: "Új funkciók érkeztek",
    text: "Mostantól lehetőség van követni a bajnokságok állását és a mérközéseket!",
    img: "/news_images/Standing.png",
    href: '/tournaments'
  },
  {
    title: "Két gólpassz az ünneplés mellé - Premier League-bajnok Szoboszlai Dominik és a Liverpool!",
    text: "Az angol élvonalbeli labdarúgó-bajnokság 34. fordulójában a Liverpool - többek között Szoboszlai Dominik két gólpasszának köszönhetően - 5-1-re legyőzte hazai pályán a Tottenhamet. Ezzel matematikailag is biztossá vált, hogy a Liverpool a Premier League bajnoka.",
    img: "/news_images/Liverpool.png",
    href: 'https://www.nemzetisport.hu/angol-labdarugas/2025/04/ket-golpassz-az-unneples-melle-premier-league-bajnok-szoboszlai-dominik-es-a-liverpool'
  },  
  {
    title: "Admin bejelentkezés",
    text: "Csatlakozz az adminok közösségéhez és hozz létre új bajnokságokat!",
    img: "/news_images/Admin.png",
    href: '/admin'
  },
  {
    title: "A Liverpool szurkolói fütyültek, és valami örökre megváltozott",
    text: "Trent Alexander-Arnold áruló lett a saját otthonában. Kifütyülték a Liverpool szurkolói, és ezzel az Anfield varázsa is elillant.",
    img: "/news_images/TAA.png",
    href: 'https://www.bama.hu/sportjegyzet/2025/05/liverpool-szurkolok-trent-alexander-arnold-futtykoncert'
  },
  {
    title: "Vége a szaúdi kalandnak? Hazatérhet Cristiano Ronaldo",
    text: "Portugál sajtóhírek szerint Cristiano Ronaldo nyáron visszatérne nevelőegyesületéhez, a portugál élvonalbeli labdarúgó-bajnokságban (Liga Portugal) szereplő Sporting CP-hez.",
    img: "/news_images/CRSporting.png",
    href: 'https://www.nemzetisport.hu/minden-mas-foci/2025/05/vege-a-szaudi-kalandnak-hazaterhet-cristiano-ronaldo'
  }
]

function NewsCarousel() {
  const [index, setIndex] = useState(0)

  const prev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + newsItems.length) % newsItems.length)
  }

  const next = () => {
    setIndex((prevIndex) => (prevIndex + 1) % newsItems.length)
  }

  const current = newsItems[index]

  return (
      <div className="news-container">
        <h2 className="news-title">Hírek</h2>

        <div className="carousel-wrapper">
          <button onClick={prev}>⇦</button>

          <div className="carousel-card">
              <a href={current.href} target="_blank" rel="noopener noreferrer">
                <img src={current.img} alt={current.title} className="carousel-image" />
              </a>
            <div className="carousel-text">
              <h3>{current.title}</h3>
              <p>{current.text}</p>
            </div>
          </div>

          <button onClick={next}>⇨</button>
        </div>
      </div>
    )
  }


  return (
    <div>
      <header>
        <h2>Bajnokság app</h2>
        <button onClick={handleToggleModal} className="header-button">
        {showModal ? 'Zárás' : 'Szerver státusz'}
      </button>
      </header>
        
      <main>
        <NewsCarousel />
        <h2>Válassz az alábbi lehetőségek közül:</h2>
        <div>
          <button className='home-page-button' onClick={handleTrackTournament}>Futó bajnokságok követése</button>
          <button className='home-page-button' onClick={handleAdminLogin}>Admin bejelentkezés</button>
        </div>
      </main>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleToggleModal}>&times;</span>
            <h3>Server Status</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0'
            }}>
              <p style={{ margin: 0 }}>Connection to backend</p>
              <div
                style={{
                  background: getStatus(),
                  width: 20,
                  borderRadius: '50%',
                  aspectRatio: 1,
                }}
              />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
