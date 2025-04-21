import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

interface Ticket {
  id: bigint
  eventId: bigint
  eventName: string
  date: bigint
  price: bigint
  used: boolean
}

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isConnected) {
        setTickets([])
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        // Mock bilet verileri
        // Gerçek uygulamada blockchain'den çekilecek
        setTimeout(() => {
          // Eğer kullanıcı bağlıysa, bazı sahte biletler gösterelim
          if (address) {
            const mockTickets: Ticket[] = [
              {
                id: BigInt(101),
                eventId: BigInt(1),
                eventName: "Blockchain Konferansı 2025",
                date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 7), // 7 gün sonra
                price: BigInt(10) * BigInt(10)**BigInt(18), // 10 ETH/MATIC
                used: false
              },
              {
                id: BigInt(102),
                eventId: BigInt(2),
                eventName: "NFT Sanat Sergisi",
                date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 14), // 14 gün sonra
                price: BigInt(5) * BigInt(10)**BigInt(18), // 5 ETH/MATIC
                used: false
              }
            ]
            
            setTickets(mockTickets)
          } else {
            setTickets([])
          }
          
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Biletler yüklenirken hata oluştu:", error)
        setError("Biletleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
        setLoading(false)
      }
    }

    fetchTickets()
  }, [address, isConnected])

  // Tarih formatını insan tarafından okunabilir hale getiren fonksiyon
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR')
  }

  // QR kod içeriği oluşturma
  const getQRContent = (ticket: Ticket) => {
    // Gerçek uygulamada, bu bir imzalı mesaj olabilir
    return `TICKET-${ticket.id}-EVENT-${ticket.eventId}-USER-${address?.substring(2, 10)}`
  }

  if (loading) {
    return <div className="loading">Biletleriniz yükleniyor...</div>
  }

  if (!isConnected) {
    return (
      <div className="tickets-page">
        <h2>Biletlerim</h2>
        <p className="connect-wallet">Biletlerinizi görmek için cüzdanınızı bağlamanız gerekiyor.</p>
      </div>
    )
  }

  return (
    <div className="tickets-page">
      <h2>Biletlerim</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {tickets.length === 0 ? (
        <p>Henüz bir biletiniz bulunmuyor. <a href="/">Etkinlikler sayfasından</a> bir etkinlik bileti satın alabilirsiniz.</p>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id.toString()} className="ticket-card">
              <div className="ticket-header">
                <h3>{ticket.eventName}</h3>
                {ticket.used && <span className="ticket-used">Kullanıldı</span>}
              </div>
              
              <div className="ticket-details">
                <p><strong>Bilet ID:</strong> #{ticket.id.toString()}</p>
                <p><strong>Tarih:</strong> {formatDate(ticket.date)}</p>
                <p><strong>Fiyat:</strong> {formatEther(ticket.price)} ETH</p>
                <p><strong>Durum:</strong> {ticket.used ? 'Kullanıldı' : 'Aktif'}</p>
              </div>
              
              {!ticket.used && (
                <div className="ticket-qr">
                  <p>QR Kodu:</p>
                  <div className="qr-code-placeholder">
                    {getQRContent(ticket)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
