import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import LoadingSpinner from '../ui/LoadingSpinner'
import { Alert, AlertType } from '../ui/Alert'
import { Button } from '../ui/Button'
import { eventManagerABI } from '../contracts/abis/eventManagerABI'
import { EVENT_MANAGER_ADDRESS } from '../config/contractAddresses'
import { fetchIPFSMetadata } from '../utils/ipfs'
import { useContractRead, useContractWrite, useWaitForTransaction } from '../lib/wagmiAdapter'

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

// Event data coming from contract (tuple)
interface EventDataTuple {
  [0]: bigint;    // id
  [1]: string;    // name
  [2]: bigint;    // date
  [3]: bigint;    // price
  [4]: bigint;    // maxTickets
  [5]: bigint;    // soldTickets
  [6]: boolean;   // active
  [7]: string;    // organizer
  [8]: string;    // metadataBase
  id: bigint;
  name: string;
  date: bigint;
  price: bigint;
  maxTickets: bigint;
  soldTickets: bigint;
  active: boolean;
  organizer: string;
  metadataBase: string;
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [eventImage, setEventImage] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const account = useAccount()
  
  // Read event data from blockchain
  const { data: eventData, isError, isLoading } = useContractRead<EventDataTuple>({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'events',
    args: [eventId ? BigInt(eventId) : BigInt(0)],
  })
  
  // Purchase ticket contract interaction
  const { writeAsync: purchaseTicket, data: purchaseData } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'purchaseTicket',
  })
  
  // Wait for purchase transaction
  const { isLoading: isPurchasing, isSuccess: purchaseSuccess } = useWaitForTransaction({
    hash: purchaseData,
  })

  useEffect(() => {
    if (isLoading) {
      return
    }
    
    if (isError || !eventData) {
      setError("Etkinlik verileri yüklenirken hata oluştu.")
      return
    }
    
    // Process event data from contract
    try {
      const parsedEvent: Event = {
        id: eventData.id || eventData[0],
        name: eventData.name || eventData[1],
        date: eventData.date || eventData[2],
        price: eventData.price || eventData[3],
        maxTickets: eventData.maxTickets || eventData[4],
        soldTickets: eventData.soldTickets || eventData[5],
        active: eventData.active || eventData[6],
        organizer: eventData.organizer || eventData[7],
        metadataBase: eventData.metadataBase || eventData[8]
      }
      
      setEvent(parsedEvent)
      
      // Fetch event metadata (image, description) from IPFS
      if (parsedEvent.metadataBase.startsWith('ipfs://')) {
        fetchIPFSMetadata(parsedEvent.metadataBase)
          .then(metadata => {
            if (metadata && metadata.image) {
              setEventImage(metadata.image)
            }
          })
          .catch(err => console.error('IPFS metadata fetch error:', err))
      }
    } catch (err) {
      console.error('Error processing event data:', err)
      setError("Etkinlik verilerini işlerken bir hata oluştu.")
    }
  }, [eventData, isLoading, isError, eventId])

  // Handle successful purchase
  useEffect(() => {
    if (purchaseSuccess) {
      // Redirect to tickets page after short delay
      const timer = setTimeout(() => {
        navigate('/tickets')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [purchaseSuccess, navigate])

  const handlePurchase = async () => {
    if (!event || !account.isConnected || !eventId) return
    
    try {
      await purchaseTicket({
        args: [BigInt(eventId)],
        value: event.price
      })
    } catch (err) {
      console.error('Purchase error:', err)
      setError("Bilet satın alınırken bir hata oluştu.")
    }
  }

  // Format date to human-readable format
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return <LoadingSpinner message="Etkinlik detayları yükleniyor..." />
  }

  if (error) {
    return <Alert type={AlertType.ERROR} message={error} />
  }

  if (!event) {
    return <Alert type={AlertType.WARNING} message="Etkinlik bulunamadı." />
  }

  const isEventPassed = event.date < BigInt(Math.floor(Date.now() / 1000))
  const isSoldOut = event.soldTickets >= event.maxTickets
  const canPurchase = !isEventPassed && !isSoldOut && event.active && account.isConnected

  return (
    <div className="event-details">
      <h2>{event.name}</h2>
      
      {purchaseSuccess && (
        <Alert 
          type={AlertType.SUCCESS} 
          message="Bilet başarıyla satın alındı! Biletleriniz sayfasına yönlendiriliyorsunuz..." 
        />
      )}
      
      <div className="event-info-card">
        {eventImage && (
          <div className="event-image">
            <img src={eventImage} alt={event.name} />
          </div>
        )}
        
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
          {account.isConnected ? (
            <Button 
              onClick={handlePurchase} 
              disabled={!canPurchase || isPurchasing}
              loading={isPurchasing}
              variant="primary"
              className="purchase-button"
            >
              {isPurchasing 
                ? "İşlem Sürüyor..." 
                : `Bilet Satın Al (${formatEther(event.price)} ETH)`
              }
            </Button>
          ) : (
            <p className="connect-wallet-notice">Bilet satın almak için cüzdanınızı bağlamanız gerekiyor.</p>
          )}
          
          <Button 
            onClick={() => navigate(-1)} 
            variant="secondary"
            className="back-button"
          >
            Geri Dön
          </Button>
        </div>
      </div>
    </div>
  )
}
