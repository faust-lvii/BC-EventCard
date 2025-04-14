import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACT_ADDRESSES } from '../contracts'

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

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [ticketCount, setTicketCount] = useState(1)
  const [isPurchasing, setIsPurchasing] = useState(false)
  
  const { address, isConnected, chain } = useAccount()
  const { writeContractAsync } = useWriteContract()
  
  // Zincir ID'sini tespit ediyoruz
  const chainId = chain?.id || 31337 // Varsayılan olarak Hardhat'i kullan

  // Sözleşme adreslerini seçiyoruz
  const eventManagerAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.eventManager

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return
      
      try {
        setLoading(true)
        
        // Burada gerçek bir zincirden etkinlik detaylarını çekeceğiz
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          const mockEvent: Event = {
            id: BigInt(eventId),
            name: eventId === "1" ? "Blockchain Konferansı 2025" : "NFT Sanat Sergisi",
            date: BigInt(Math.floor(new Date().getTime() / 1000) + 86400 * (eventId === "1" ? 7 : 14)),
            price: BigInt(eventId === "1" ? 10 : 5) * BigInt(10)**BigInt(18),
            maxTickets: BigInt(eventId === "1" ? 100 : 50),
            soldTickets: BigInt(eventId === "1" ? 42 : 12),
            active: true,
            organizer: "0x0000000000000000000000000000000000000000",
            metadataBase: eventId === "1" ? "ipfs://QmHash" : "ipfs://QmHash2"
          }
          
          setEvent(mockEvent)
          setLoading(false)
        }, 1000)
        
      } catch (error) {
        console.error("Etkinlik detayları yüklenirken hata oluştu:", error)
        setLoading(false)
      }
    }

    fetchEventDetails()
  }, [eventId, chainId, eventManagerAddress])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR')
  }

  const handlePurchase = async () => {
    if (!event || !isConnected || !address || !eventManagerAddress) {
      alert("Satın alma işlemi için cüzdan bağlantısı gerekiyor!")
      return
    }

    try {
      setIsPurchasing(true)
      
      // Burada gerçek zincirde işlem yapacağız
      // Kodun çalışması için yorumları kaldırabilirsiniz
      /*
      const result = await writeContractAsync({
        address: eventManagerAddress as `0x${string}`,
        abi: CONTRACT_ABIS.eventManager,
        functionName: 'buyTicket',
        args: [event.id],
        value: event.price * BigInt(ticketCount)
      })
      
      // İşlem onaylanana kadar bekle
      // Burada bir bekletme işlemi veya doğrulama yapılabilir
      
      alert("Bilet satın alma başarılı!")
      navigate('/tickets')
      */
      
      // Şimdilik simülasyon yapıyoruz
      setTimeout(() => {
        alert("Bilet satın alma başarılı! (Simülasyon)")
        navigate('/tickets')
        setIsPurchasing(false)
      }, 2000)
      
    } catch (err) {
      console.error("Bilet satın alınırken hata oluştu:", err)
      alert(`Hata: ${err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu"}`)
      setIsPurchasing(false)
    }
  }

  if (loading) {
    return <div className="loading">Etkinlik detayları yükleniyor...</div>
  }

  if (!event) {
    return (
      <div className="event-not-found">
        <h2>Etkinlik Bulunamadı</h2>
        <p>İstediğiniz etkinlik bulunamadı veya artık mevcut değil.</p>
        <button onClick={() => navigate('/')} className="button">
          Etkinliklere Dön
        </button>
      </div>
    )
  }

  const remainingTickets = event.maxTickets - event.soldTickets
  const isEventOver = Number(event.date) * 1000 < new Date().getTime()
  const isSoldOut = remainingTickets <= 0
  const canPurchase = !isEventOver && !isSoldOut && event.active

  return (
    <div className="event-details">
      <button onClick={() => navigate('/')} className="back-button">
        &larr; Etkinliklere Dön
      </button>
      
      <div className="event-header">
        <h2>{event.name}</h2>
        {!event.active && <span className="event-status inactive">İnaktif</span>}
        {isEventOver && <span className="event-status over">Sona Erdi</span>}
        {isSoldOut && <span className="event-status sold-out">Tükendi</span>}
      </div>
      
      <div className="event-info-card">
        <div className="event-info-item">
          <strong>Tarih:</strong> {formatDate(event.date)}
        </div>
        <div className="event-info-item">
          <strong>Bilet Fiyatı:</strong> {formatEther(event.price)} ETH
        </div>
        <div className="event-info-item">
          <strong>Kalan Bilet:</strong> {remainingTickets.toString()} / {event.maxTickets.toString()}
        </div>
        <div className="event-info-item">
          <strong>Organizatör:</strong> {event.organizer.substring(0, 6)}...{event.organizer.substring(event.organizer.length - 4)}
        </div>
      </div>
      
      <div className="event-description">
        <h3>Etkinlik Açıklaması</h3>
        <p>Bu etkinlik için henüz detaylı bir açıklama bulunmuyor.</p>
      </div>
      
      {canPurchase && (
        <div className="purchase-section">
          <h3>Bilet Satın Al</h3>
          
          <div className="ticket-counter">
            <button 
              onClick={() => setTicketCount(prev => Math.max(1, prev - 1))}
              disabled={ticketCount <= 1}
              className="counter-button"
            >
              -
            </button>
            <span className="ticket-count">{ticketCount}</span>
            <button 
              onClick={() => setTicketCount(prev => Math.min(Number(remainingTickets), prev + 1))}
              disabled={ticketCount >= Number(remainingTickets)}
              className="counter-button"
            >
              +
            </button>
          </div>
          
          <div className="price-summary">
            <p>Toplam: {formatEther(event.price * BigInt(ticketCount))} ETH</p>
          </div>
          
          <button 
            onClick={handlePurchase}
            disabled={!isConnected || isPurchasing || isEventOver || isSoldOut || !event.active}
            className="purchase-button"
          >
            {isPurchasing ? 'İşlem Yapılıyor...' : 'Satın Al'}
          </button>
          
          {!isConnected && (
            <p className="connection-warning">Bilet satın almak için cüzdanınızı bağlamalısınız.</p>
          )}
        </div>
      )}
    </div>
  )
}
