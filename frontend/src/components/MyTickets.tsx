import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

interface Ticket {
  id: string
  eventId: string
  eventName: string
  date: string
  used: boolean
  image: string
}

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { address, isConnected, chain } = useAccount()
  
  // Zincir ID'sini tespit ediyoruz
  const chainId = chain?.id || 31337 // Varsayılan olarak Hardhat'i kullan

  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!isConnected || !address) {
        setTickets([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Burada gerçek zincir verilerini çekeceğiz
        // Şimdilik örnek veriler kullanıyoruz
        setTimeout(() => {
          const mockTickets: Ticket[] = [
            {
              id: "1",
              eventId: "1",
              eventName: "Blockchain Konferansı 2025",
              date: "2025-04-21 10:00",
              used: false,
              image: "https://placehold.co/400x200/3498db/FFFFFF/png?text=Blockchain+Konferansi+2025"
            }
          ]
          
          setTickets(mockTickets)
          setLoading(false)
        }, 1000)
        
      } catch (error) {
        console.error("Biletler yüklenirken hata oluştu:", error)
        setLoading(false)
      }
    }

    fetchUserTickets()
  }, [address, isConnected, chain, chainId])

  if (!isConnected) {
    return (
      <div className="my-tickets not-connected">
        <h2>Biletlerim</h2>
        <p>Biletlerinizi görmek için cüzdanınızı bağlamalısınız.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Biletleriniz yükleniyor...</div>
  }

  if (tickets.length === 0) {
    return (
      <div className="my-tickets empty">
        <h2>Biletlerim</h2>
        <p>Henüz bir biletiniz bulunmuyor.</p>
        <a href="/" className="button">Etkinliklere Göz At</a>
      </div>
    )
  }

  const handleTransfer = (ticketId: string) => {
    // Bilet transfer işlemi burada gerçekleştirilecek
    alert(`Transfer işlemi için ${ticketId} no'lu bilet seçildi.`)
  }

  return (
    <div className="my-tickets">
      <h2>Biletlerim</h2>
      
      <div className="tickets-grid">
        {tickets.map((ticket) => (
          <div key={ticket.id} className={`ticket-card ${ticket.used ? 'used' : ''}`}>
            <div className="ticket-image">
              <img src={ticket.image} alt={ticket.eventName} />
              {ticket.used && <div className="used-overlay">KULLANILDI</div>}
            </div>
            
            <div className="ticket-info">
              <h3>{ticket.eventName}</h3>
              <p><strong>Bilet No:</strong> #{ticket.id}</p>
              <p><strong>Tarih:</strong> {ticket.date}</p>
              <p><strong>Durum:</strong> {ticket.used ? 'Kullanıldı' : 'Aktif'}</p>
            </div>
            
            {!ticket.used && (
              <div className="ticket-actions">
                <button 
                  className="transfer-button"
                  onClick={() => handleTransfer(ticket.id)}
                >
                  Transfer Et
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
