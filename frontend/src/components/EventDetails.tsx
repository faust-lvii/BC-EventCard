import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACT_ADDRESSES } from '../contracts'
import { Event } from './CreateEvent'

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const navigate = useNavigate()
  const { address, chain } = useAccount()
  
  // Zincir ID'sini tespit ediyoruz
  const chainId = chain?.id || 31337 // Varsayılan olarak Hardhat'i kullan

  // Sözleşme adreslerini seçiyoruz
  const eventManagerAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.eventManager

  // localStorage'den etkinliği alır
  const getEventFromLocalStorage = (id: string): Event | null => {
    try {
      const eventsString = localStorage.getItem('events')
      if (eventsString) {
        // JSON.parse ile alınan veriler bigint tipini kaybeder, dönüştürmemiz gerekiyor
        const parsedEvents = JSON.parse(eventsString);
        const event = parsedEvents.find((e: any) => e.id.toString() === id);
        
        if (event) {
          return {
            ...event,
            id: BigInt(event.id),
            date: BigInt(event.date),
            price: BigInt(event.price),
            maxTickets: BigInt(event.maxTickets),
            soldTickets: BigInt(event.soldTickets)
          };
        }
      }
      return null;
    } catch (error) {
      console.error("localStorage'dan etkinlik okurken hata:", error);
      return null;
    }
  };

  // localStorage'e bilet satın alımını kaydeder
  const savePurchaseToLocalStorage = (eventId: string) => {
    try {
      const eventsString = localStorage.getItem('events')
      if (eventsString) {
        const parsedEvents = JSON.parse(eventsString);
        const updatedEvents = parsedEvents.map((e: any) => {
          if (e.id.toString() === eventId) {
            return { 
              ...e, 
              soldTickets: (parseInt(e.soldTickets) + 1).toString() 
            };
          }
          return e;
        });
        
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        
        // Biletleri de kaydet
        const ticketsString = localStorage.getItem('tickets') || '[]';
        const tickets = JSON.parse(ticketsString);
        const eventObj = parsedEvents.find((e: any) => e.id.toString() === eventId);
        
        if (eventObj) {
          const newTicket = {
            id: Date.now().toString(), // Benzersiz ID
            eventId: eventId,
            eventName: eventObj.name,
            date: eventObj.date,
            price: eventObj.price,
            used: false
          };
          
          tickets.push(newTicket);
          localStorage.setItem('tickets', JSON.stringify(tickets));
        }
      }
    } catch (error) {
      console.error("localStorage'a bilet satın alma işlemi kaydedilirken hata:", error);
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!eventId) {
          throw new Error("Geçersiz etkinlik ID'si")
        }
        
        // localStorage'dan etkinliği al
        const event = getEventFromLocalStorage(eventId);
        
        if (event) {
          setEvent(event);
        } else {
          // localStorage'da yoksa mock veri oluştur
          const mockEvent: Event = {
            id: BigInt(eventId),
            name: `Etkinlik ${eventId}`,
            date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * 7), // 7 gün sonra
            price: BigInt(10) * BigInt(10)**BigInt(18), // 10 ETH/MATIC
            maxTickets: BigInt(100),
            soldTickets: BigInt(42),
            active: true,
            organizer: "0x0000000000000000000000000000000000000000",
            metadataBase: "ipfs://QmHash"
          }
          
          setEvent(mockEvent)
        }
      } catch (error) {
        console.error("Etkinlik detayları yüklenirken hata oluştu:", error)
        setError("Etkinlik detayları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      } finally {
        setLoading(false)
      }
    }

    fetchEventDetails()
  }, [eventId])

  // Tarih formatını insan tarafından okunabilir hale getiren fonksiyon
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR')
  }
  
  // Bilet satın alma işlemi (simülasyon)
  const handlePurchase = () => {
    if (!event || !address || !eventId) return
    
    setIsPurchasing(true)
    
    // Simülasyon: 2 saniye sonra başarılı işlem
    setTimeout(() => {
      // Bilet satın alma işlemini localStorage'e kaydet
      savePurchaseToLocalStorage(eventId);
      
      setPurchaseSuccess(true)
      setIsPurchasing(false)
      
      // 3 saniye sonra biletlerim sayfasına yönlendir
      setTimeout(() => {
        navigate('/tickets')
      }, 3000)
    }, 2000)
  }

  if (loading) {
    return <div className="loading">Etkinlik detayları yükleniyor...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!event) {
    return <div className="not-found">Etkinlik bulunamadı.</div>
  }

  const isEventPassed = event.date < BigInt(Math.floor(Date.now() / 1000))
  const isSoldOut = event.soldTickets >= event.maxTickets
  const canPurchase = !isEventPassed && !isSoldOut && event.active

  return (
    <div className="event-details">
      <h2>{event.name}</h2>
      
      {purchaseSuccess && (
        <div className="success-message">
          Bilet başarıyla satın alındı! Biletleriniz sayfasına yönlendiriliyorsunuz...
        </div>
      )}
      
      <div className="event-info-card">
        <div className="event-info">
          <p><strong>Tarih:</strong> {formatDate(event.date)}</p>
          <p><strong>Fiyat:</strong> {formatEther(event.price)} ETH</p>
          <p><strong>Kalan Bilet:</strong> {(event.maxTickets - event.soldTickets).toString()} / {event.maxTickets.toString()}</p>
          <p><strong>Durum:</strong> {event.active ? 'Aktif' : 'Pasif'}</p>
          
          {isEventPassed && (
            <p className="event-status warning">Bu etkinlik sona ermiştir.</p>
          )}
          
          {isSoldOut && (
            <p className="event-status warning">Bu etkinlik için tüm biletler tükenmiştir.</p>
          )}
          
          {!event.active && (
            <p className="event-status warning">Bu etkinlik şu anda aktif değildir.</p>
          )}
        </div>

        <div className="event-actions">
          {address ? (
            <button 
              onClick={handlePurchase} 
              disabled={!canPurchase || isPurchasing}
              className="purchase-button"
            >
              {isPurchasing ? "İşlem Sürüyor..." : `Bilet Satın Al (${formatEther(event.price)} ETH)`}
            </button>
          ) : (
            <p className="connect-wallet-notice">Bilet satın almak için cüzdanınızı bağlamanız gerekiyor.</p>
          )}
          
          <button onClick={() => navigate(-1)} className="back-button">
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  )
}
