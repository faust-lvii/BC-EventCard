import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

interface Ticket {
  id: string
  eventId: string
  eventName: string
  date: string
  price: string
  used: boolean
}

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address, isConnected } = useAccount()

  // localStorage'den biletleri al
  const getTicketsFromLocalStorage = (): Ticket[] => {
    try {
      const ticketsString = localStorage.getItem('tickets')
      if (ticketsString) {
        return JSON.parse(ticketsString);
      }
      return [];
    } catch (error) {
      console.error("localStorage'dan biletleri okurken hata:", error);
      return [];
    }
  };

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
        
        // localStorage'dan biletleri al
        const localStorageTickets = getTicketsFromLocalStorage();
        
        if (localStorageTickets.length > 0) {
          setTickets(localStorageTickets);
          setLoading(false);
        } else {
          // localStorage'da bilet yoksa mock bilet verileri oluştur
          setTimeout(() => {
            // Eğer kullanıcı bağlıysa, bazı sahte biletler gösterelim
            if (address) {
              const mockTickets: Ticket[] = [
                {
                  id: "101",
                  eventId: "1",
                  eventName: "Blockchain Konferansı 2025",
                  date: (Math.floor(new Date().getTime() / 1000) + 86400 * 7).toString(), // 7 gün sonra
                  price: (BigInt(10) * BigInt(10)**BigInt(18)).toString(), // 10 ETH/MATIC
                  used: false
                },
                {
                  id: "102",
                  eventId: "2",
                  eventName: "NFT Sanat Sergisi",
                  date: (Math.floor(new Date().getTime() / 1000) + 86400 * 14).toString(), // 14 gün sonra
                  price: (BigInt(5) * BigInt(10)**BigInt(18)).toString(), // 5 ETH/MATIC
                  used: false
                }
              ]
              
              // Mock biletleri localStorage'e kaydet
              localStorage.setItem('tickets', JSON.stringify(mockTickets));
              setTickets(mockTickets)
            } else {
              setTickets([])
            }
            
            setLoading(false)
          }, 1000)
        }
      } catch (error) {
        console.error("Biletler yüklenirken hata oluştu:", error)
        setError("Biletleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
        setLoading(false)
      }
    }

    fetchTickets()

    // localStorage değişikliklerini dinle
    const handleStorageChange = () => {
      if (isConnected) {
        const updatedTickets = getTicketsFromLocalStorage();
        setTickets(updatedTickets);
      }
    };

    // Storage event listener ekle
    window.addEventListener('storage', handleStorageChange);

    // Component unmount olduğunda event listener'ı temizle
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [address, isConnected])

  // localStorage'da değişiklik olup olmadığını kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        const localStorageTickets = getTicketsFromLocalStorage();
        if (JSON.stringify(localStorageTickets) !== JSON.stringify(tickets)) {
          setTickets(localStorageTickets);
        }
      }
    }, 3000); // 3 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [tickets, isConnected]);

  // Tarih formatını insan tarafından okunabilir hale getiren fonksiyon
  const formatDate = (timestamp: string) => {
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
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <h3>{ticket.eventName}</h3>
                {ticket.used && <span className="ticket-used">Kullanıldı</span>}
              </div>
              
              <div className="ticket-details">
                <p><strong>Bilet ID:</strong> #{ticket.id}</p>
                <p><strong>Tarih:</strong> {formatDate(ticket.date)}</p>
                <p><strong>Fiyat:</strong> {formatEther(BigInt(ticket.price))} ETH</p>
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
