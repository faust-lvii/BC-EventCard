import { ConnectButton } from '@rainbow-me/rainbowkit'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { EventList } from './components/EventList'
import { MyTickets } from './components/MyTickets'
import { EventDetails } from './components/EventDetails'
import { Validator } from './components/Validator'

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <div className="logo">
            <h1>BC-EventCard</h1>
            <p>Blockchain Tabanlı Biletleme Sistemi</p>
          </div>
          <nav>
            <Link to="/">Etkinlikler</Link>
            <Link to="/tickets">Biletlerim</Link>
            <Link to="/validator">Doğrulayıcı</Link>
          </nav>
          <ConnectButton />
        </header>

        <main>
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/validator" element={<Validator />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; {new Date().getFullYear()} BC-EventCard - Blockchain Tabanlı Biletleme Sistemi</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
