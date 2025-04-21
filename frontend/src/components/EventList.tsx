import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { CreateEvent, Event } from './CreateEvent'

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { address } = useAccount()

  // localStorage'den etkinlikleri alır
  const getEventsFromLocalStorage = (): Event[] => {
    try {
      const eventsString = localStorage.getItem('events')
      if (eventsString) {
        // JSON.parse ile alınan veriler bigint tipini kaybeder, dönüştürmemiz gerekiyor
        const parsedEvents = JSON.parse(eventsString);
        return parsedEvents.map((event: any) => ({
          ...event,
          id: BigInt(event.id),
          date: BigInt(event.date),
          price: BigInt(event.price),
          maxTickets: BigInt(event.maxTickets),
          soldTickets: BigInt(event.soldTickets)
        }));
      }
      return [];
    } catch (error) {
      console.error("localStorage'dan etkinlikleri okurken hata:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // LocalStorage'dan etkinlikleri al
        const localStorageEvents = getEventsFromLocalStorage();
        
        // Eğer localStorage'da etkinlik yoksa, örnek etkinlikler göster
        if (localStorageEvents.length === 0) {
          // Mock etkinlik verileri
          // Gerçek uygulamada blockchain'den çekilecek
          setTimeout(() => {
            const mockEvents: Event[] = [
              {
                id: BigInt(1),
                name: "Blockchain Konferansı 2025",
                date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 7), // 7 gün sonra
                price: BigInt(10) * BigInt(10)**BigInt(18), // 10 ETH/MATIC
                maxTickets: BigInt(100),
                soldTickets: BigInt(42),
                active: true,
                organizer: "0x0000000000000000000000000000000000000000",
                metadataBase: "ipfs://QmHash"
              },
              {
                id: BigInt(2),
                name: "NFT Sanat Sergisi",
                date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 14), // 14 gün sonra
                price: BigInt(5) * BigInt(10)**BigInt(18), // 5 ETH/MATIC
                maxTickets: BigInt(50),
                soldTickets: BigInt(12),
                active: true,
                organizer: "0x0000000000000000000000000000000000000000",
                metadataBase: "ipfs://QmHash2"
              },
              {
                id: BigInt(3),
                name: "Web3 Geliştirici Buluşması",
                date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 21), // 21 gün sonra
                price: BigInt(2) * BigInt(10)**BigInt(18), // 2 ETH/MATIC
                maxTickets: BigInt(200),
                soldTickets: BigInt(75),
                active: true,
                organizer: "0x0000000000000000000000000000000000000000",
                metadataBase: "ipfs://QmHash3"
              }
            ]
            
            setEvents(mockEvents)
            // Örnek etkinlikleri localStorage'e kaydet
            localStorage.setItem('events', JSON.stringify(mockEvents))
            setLoading(false)
          }, 1000) // 1 saniye gecikme ile veri gelmiş gibi davran
        } else {
          // localStorage'dan etkinlikleri al
          setEvents(localStorageEvents)
          setLoading(false)
        }
      } catch (error) {
        console.error("Etkinlikler yüklenirken hata oluştu:", error)
        setError("Etkinlikler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
        setLoading(false)
      }
    }

    fetchEvents()
    
    // localStorage değişikliklerini dinle
    const handleStorageChange = () => {
      const updatedEvents = getEventsFromLocalStorage()
      setEvents(updatedEvents)
    }
    
    // Storage event listener ekle
    window.addEventListener('storage', handleStorageChange)
    
    // Komponent yok edildiğinde event listener'ı temizle
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // CreteEvent bileşeninin submit olayını yakalamak için bir interval
  useEffect(() => {
    const interval = setInterval(() => {
      const localStorageEvents = getEventsFromLocalStorage()
      if (localStorageEvents.length !== events.length) {
        setEvents(localStorageEvents)
      }
    }, 3000) // 3 saniyede bir kontrol et
    
    return () => clearInterval(interval)
  }, [events.length])

  // Tarih formatını insan tarafından okunabilir hale getiren fonksiyon
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR')
  }

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm)
  }

  if (loading) {
    return <div className="loading">Etkinlikler yükleniyor...</div>
  }

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <h2>Yaklaşan Etkinlikler</h2>
        {address && (
          <button onClick={toggleCreateForm} className="create-event-button">
            {showCreateForm ? 'Etkinlik Oluşturma Formunu Gizle' : 'Yeni Etkinlik Oluştur'}
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showCreateForm && <CreateEvent />}
      
      {!error && events.length === 0 ? (
        <p>Gösterilecek etkinlik bulunamadı. Yeni bir etkinlik oluşturmak ister misiniz?</p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id.toString()} className="event-card">
              <h3>{event.name}</h3>
              <div className="event-info">
                <p><strong>Tarih:</strong> {formatDate(event.date)}</p>
                <p><strong>Fiyat:</strong> {formatEther(event.price)} ETH</p>
                <p><strong>Kalan Bilet:</strong> {(event.maxTickets - event.soldTickets).toString()} / {event.maxTickets.toString()}</p>
                <p><strong>Durum:</strong> {event.active ? 'Aktif' : 'Pasif'}</p>
              </div>
              <Link to={`/event/${event.id}`} className="event-button">
                Detayları Görüntüle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
