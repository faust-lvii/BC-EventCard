import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '../contracts'
import { formatEther } from 'viem'

interface Event {
  id: bigint
  name: string
  date: bigint
  price: bigint
  maxTickets: bigint
  soldTickets: bigint
  active: boolean
  organizer: string
  metadataBase: string
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { chain } = useAccount()
  
  // Zincir ID'sini tespit ediyoruz
  const chainId = chain?.id || 31337 // Varsayılan olarak Hardhat'i kullan

  // Sözleşme adreslerini seçiyoruz
  const eventManagerAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.eventManager

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        // Burada gerçek bir zincirden etkinlikleri çekeceğiz
        // Şimdilik örnek veriler kullanıyoruz
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
          }
        ]
        
        setEvents(mockEvents)
      } catch (error) {
        console.error("Etkinlikler yüklenirken hata oluştu:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [chainId, eventManagerAddress])

  // Tarih formatını insan tarafından okunabilir hale getiren fonksiyon
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR')
  }

  if (loading) {
    return <div className="loading">Etkinlikler yükleniyor...</div>
  }

  return (
    <div className="event-list">
      <h2>Yaklaşan Etkinlikler</h2>
      
      {events.length === 0 ? (
        <p>Gösterilecek etkinlik bulunamadı.</p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id.toString()} className="event-card">
              <h3>{event.name}</h3>
              <div className="event-info">
                <p><strong>Tarih:</strong> {formatDate(event.date)}</p>
                <p><strong>Fiyat:</strong> {formatEther(event.price)} ETH</p>
                <p><strong>Kalan Bilet:</strong> {(event.maxTickets - event.soldTickets).toString()} / {event.maxTickets.toString()}</p>
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
