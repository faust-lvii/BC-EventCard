import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Alert, AlertType } from '../ui/Alert'
import { Button } from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import { eventManagerABI } from '../contracts/abis/eventManagerABI'
import { ticketNFTABI } from '../contracts/abis/ticketNFTABI'
import { EVENT_MANAGER_ADDRESS } from '../config/contractAddresses'
import { ipfsToHttpUrl, fetchIPFSMetadata } from '../utils/ipfs'
import { useContractRead, useContractWrite, useWaitForTransaction } from '../lib/wagmiAdapter'
import { Address } from '../lib/wagmiAdapter'

interface ValidatorTicket {
  id: string;
  eventId: string;
  eventName: string;
  ticketId?: string;
  imageUrl?: string;
  valid?: boolean;
  used?: boolean;
}

export function Validator() {
  const account = useAccount()
  const [ticketCode, setTicketCode] = useState('')
  const [scannedTicket, setScannedTicket] = useState<ValidatorTicket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Check if the current user is a validator
  const { data: isValidator, isLoading: validatorCheckLoading } = useContractRead<boolean>({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'validators',
    args: [account.address || '0x0'],
  })

  // Read TicketNFT contract address
  const { data: ticketNFTAddress } = useContractRead<Address>({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'ticketNFT',
  })

  // Validate ticket contract interaction
  const { writeAsync: validateTicket, data: validateData } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'validateTicket',
  })

  // Check ticket usage status
  const { data: ticketUsed, refetch: refetchTicketUsed } = useContractRead<boolean>({
    address: ticketNFTAddress as Address,
    abi: ticketNFTABI,
    functionName: 'isTicketUsed',
    args: [scannedTicket?.ticketId ? BigInt(scannedTicket.ticketId) : BigInt(0)],
  })

  // Transaction status
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransaction({
    hash: validateData,
  })

  // Effect for transaction success
  useEffect(() => {
    if (txSuccess) {
      setMessage('Bilet başarıyla doğrulandı ve kullanıldı olarak işaretlendi.')
      // Refetch the ticket usage status
      refetchTicketUsed()
      setIsValidating(false)
    }
  }, [txSuccess, refetchTicketUsed])

  // Handle ticket code input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketCode(e.target.value)
    // Clear any previous errors or messages
    setError(null)
    setMessage(null)
  }

  // Scan ticket (using QR code or manual entry)
  const handleScanTicket = async () => {
    if (!ticketCode.trim()) {
      setError('Lütfen bir bilet kodu girin.')
      return
    }

    setError(null)
    setMessage(null)
    setIsValidating(true)

    try {
      // In a real application, this would verify the ticket on the blockchain
      // Parse the ticket code (format: 'eventId:tokenId')
      const [eventId, ticketId] = ticketCode.split(':')
      
      if (!eventId || !ticketId) {
        throw new Error('Geçersiz bilet kodu formatı. Doğru format: "eventId:ticketId"')
      }

      // Call the contract to check the ticket's event
      const eventCheck = await fetch(`/api/tickets/check/${ticketId}`)
      const { event } = await eventCheck.json()

      // Get the ticket's token URI and metadata
      const ticketURI = await fetch(`/api/tickets/uri/${ticketId}`)
      const { uri } = await ticketURI.json()
      
      // Fetch metadata from IPFS
      const metadata = await fetchIPFSMetadata(uri)
      
      // Create the scanned ticket object
      const ticket: ValidatorTicket = {
        id: ticketId,
        ticketId: ticketId,
        eventId: eventId,
        eventName: event?.name || 'Bilinmeyen Etkinlik',
        imageUrl: metadata?.image ? ipfsToHttpUrl(metadata.image) : undefined,
        valid: true,
        used: ticketUsed as boolean
      }
      
      setScannedTicket(ticket)
      setMessage('Bilet bulundu. Doğrulamak için "Bileti Doğrula" butonuna tıklayın.')
    } catch (error) {
      console.error('Ticket scanning error:', error)
      setError('Bilet doğrulanamadı. Lütfen geçerli bir bilet kodu girdiğinizden emin olun.')
    } finally {
      setIsValidating(false)
    }
  }

  // Handle ticket validation
  const handleValidateTicket = async () => {
    if (!scannedTicket?.ticketId) {
      setError('Doğrulanacak bilet bulunamadı.')
      return
    }

    setIsValidating(true)
    
    try {
      // Call the contract to validate the ticket
      await validateTicket({
        args: [BigInt(scannedTicket.ticketId)]
      })
    } catch (error) {
      console.error('Validation error:', error)
      setError('Bilet doğrulanırken bir hata oluştu.')
      setIsValidating(false)
    }
  }

  // If wallet is not connected
  if (!account.isConnected) {
    return (
      <div className="validator">
        <h2>Bilet Doğrulayıcı</h2>
        <Alert 
          type={AlertType.WARNING} 
          message="Bilet doğrulamak için cüzdanınızı bağlamanız gerekiyor." 
        />
      </div>
    )
  }

  // If checking validator status
  if (validatorCheckLoading) {
    return <LoadingSpinner message="Yetkilendirme kontrol ediliyor..." />
  }

  // If not a validator
  if (!isValidator) {
    return (
      <div className="validator">
        <h2>Bilet Doğrulayıcı</h2>
        <Alert 
          type={AlertType.ERROR} 
          message="Bu adres bilet doğrulama yetkisine sahip değil. Lütfen yetkilendirilmiş bir hesap kullanın." 
        />
      </div>
    )
  }

  return (
    <div className="validator">
      <h2>Bilet Doğrulayıcı</h2>
      
      {error && (
        <Alert 
          type={AlertType.ERROR} 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      {message && (
        <Alert 
          type={AlertType.SUCCESS} 
          message={message} 
          onClose={() => setMessage(null)} 
        />
      )}
      
      <div className="ticket-scanner">
        <h3>Bilet Tarama</h3>
        <div className="scanner-input">
          <input
            type="text"
            value={ticketCode}
            onChange={handleInputChange}
            placeholder="Bilet Kodu (örn: 1:123)"
            disabled={isValidating || txLoading}
          />
          <Button
            onClick={handleScanTicket}
            loading={isValidating}
            disabled={isValidating || txLoading || !ticketCode.trim()}
            variant="primary"
          >
            Bileti Tara
          </Button>
        </div>
        
        <p className="scanner-help">
          Bilet kodunu QR koddan tarayın veya manuel olarak girin.
          <br />
          Format: "etkinlikId:biletId" (örn: "1:123")
        </p>
      </div>
      
      {scannedTicket && (
        <div className="scanned-ticket">
          <h3>Bilet Bilgileri</h3>
          
          <div className="ticket-details">
            {scannedTicket.imageUrl && (
              <div className="ticket-image">
                <img src={scannedTicket.imageUrl} alt="Bilet" />
              </div>
            )}
            
            <div className="ticket-info">
              <p><strong>Etkinlik:</strong> {scannedTicket.eventName}</p>
              <p><strong>Bilet ID:</strong> {scannedTicket.id}</p>
              <p>
                <strong>Durum:</strong> 
                {scannedTicket.used 
                  ? <span className="used-status">Kullanılmış</span> 
                  : <span className="valid-status">Geçerli</span>
                }
              </p>
            </div>
            
            <div className="ticket-actions">
              <Button
                onClick={handleValidateTicket}
                loading={txLoading}
                disabled={txLoading || isValidating || scannedTicket.used}
                variant={scannedTicket.used ? "outline" : "primary"}
              >
                {scannedTicket.used ? "Bilet Kullanılmış" : "Bileti Doğrula"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
