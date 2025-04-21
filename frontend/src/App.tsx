import { ConnectButton } from '@rainbow-me/rainbowkit'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { EventList } from './components/EventList'
import { MyTickets } from './components/MyTickets'
import { EventDetails } from './components/EventDetails'
import { Validator } from './components/Validator'
import { CreateEvent } from './components/CreateEvent'

// Özelleştirilmiş Cüzdan Bağlantı Butonu
const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    className="connect-wallet-button"
                  >
                    Cüzdanı Bağla
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    className="wrong-network-button"
                  >
                    Yanlış Ağ
                  </button>
                );
              }

              return (
                <div className="connected-container">
                  <button 
                    onClick={openChainModal} 
                    className="chain-button"
                  >
                    {chain.name}
                  </button>

                  <button 
                    onClick={openAccountModal} 
                    className="account-button"
                  >
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

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
            <Link to="/create">Etkinlik Oluştur</Link>
            <Link to="/tickets">Biletlerim</Link>
            <Link to="/validator">Doğrulayıcı</Link>
          </nav>
          <CustomConnectButton />
        </header>

        <main>
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/create" element={<CreateEvent />} />
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
