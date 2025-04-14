import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESSES } from '../contracts'

export function Validator() {
  const [ticketId, setTicketId] = useState('')
  const [eventId, setEventId] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    ticketDetails?: {
      owner: string;
      eventName: string;
      ticketId: string;
    };
  } | null>(null)
  
  const { address, isConnected, chain } = useAccount()
  const { writeContractAsync } = useWriteContract()
  
  // Zincir ID'sini tespit ediyoruz
  const chainId = chain?.id || 31337 // Varsayılan olarak Hardhat'i kullan

  // Sözleşme adreslerini seçiyoruz
  const eventManagerAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.eventManager

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketId || !eventId) {
      alert("Lütfen etkinlik kimliği ve bilet kimliği girin.")
      return
    }
    
    if (!isConnected || !address) {
      alert("Doğrulama yapmak için cüzdanınızı bağlamalısınız.")
      return
    }
    
    try {
      setValidating(true)
      setValidationResult(null)
      
      // Burada gerçek zincirde doğrulama yapacağız
      // Ancak şimdilik simülasyon yapıyoruz
      
      // Gerçek kodun nasıl olacağına bir örnek:
      /*
      await writeContractAsync({
        address: eventManagerAddress as `0x${string}`,
        abi: CONTRACT_ABIS.eventManager,
        functionName: 'validateTicket',
        args: [BigInt(eventId), BigInt(ticketId)]
      })
      */
      
      // Simülasyon için:
      setTimeout(() => {
        // Örnek bir doğrulama sonucu
        const isValidTicket = Math.random() > 0.3 // %70 olasılıkla geçerli
        
        if (isValidTicket) {
          setValidationResult({
            isValid: true,
            message: "Bilet geçerli!",
            ticketDetails: {
              owner: "0x1234...5678",
              eventName: eventId === "1" ? "Blockchain Konferansı 2025" : "NFT Sanat Sergisi",
              ticketId: ticketId
            }
          })
        } else {
          setValidationResult({
            isValid: false,
            message: "Bilet geçersiz veya daha önce kullanılmış!"
          })
        }
        
        setValidating(false)
      }, 2000)
      
    } catch (error) {
      console.error("Bilet doğrulanırken hata oluştu:", error)
      setValidationResult({
        isValid: false,
        message: `Hata: ${error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"}`
      })
      setValidating(false)
    }
  }

  const handleMarkAsUsed = async () => {
    if (!validationResult?.isValid || !ticketId || !eventId) return
    
    try {
      setValidating(true)
      
      // Burada gerçek zincirde bilet kullanıldı olarak işaretlenecek
      // Ancak şimdilik simülasyon yapıyoruz
      
      // Gerçek kodun nasıl olacağına bir örnek:
      /*
      await writeContractAsync({
        address: eventManagerAddress as `0x${string}`,
        abi: CONTRACT_ABIS.eventManager,
        functionName: 'markTicketAsUsed',
        args: [BigInt(eventId), BigInt(ticketId)]
      })
      */
      
      // Simülasyon için:
      setTimeout(() => {
        alert("Bilet başarıyla kullanıldı olarak işaretlendi!")
        setValidationResult(null)
        setTicketId('')
        setEventId('')
        setValidating(false)
      }, 1500)
      
    } catch (error) {
      console.error("Bilet işaretlenirken hata oluştu:", error)
      alert(`Hata: ${error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"}`)
      setValidating(false)
    }
  }

  return (
    <div className="validator">
      <h2>Bilet Doğrulayıcı</h2>
      <p>Etkinlik girişinde bilet doğrulamak için bu aracı kullanabilirsiniz.</p>
      
      <form onSubmit={handleValidate} className="validator-form">
        <div className="form-group">
          <label htmlFor="eventId">Etkinlik Kimliği:</label>
          <input
            id="eventId"
            type="number"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Örn: 1"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="ticketId">Bilet Kimliği:</label>
          <input
            id="ticketId"
            type="number"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Örn: 42"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="validate-button"
          disabled={validating || !isConnected}
        >
          {validating ? 'Doğrulanıyor...' : 'Doğrula'}
        </button>
      </form>
      
      {!isConnected && (
        <div className="warning">
          <p>Bilet doğrulamak için cüzdanınızı bağlamalısınız.</p>
        </div>
      )}
      
      {validationResult && (
        <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
          <h3>{validationResult.isValid ? '✅ Bilet Geçerli' : '❌ Bilet Geçersiz'}</h3>
          <p>{validationResult.message}</p>
          
          {validationResult.isValid && validationResult.ticketDetails && (
            <div className="ticket-details">
              <p><strong>Etkinlik:</strong> {validationResult.ticketDetails.eventName}</p>
              <p><strong>Bilet No:</strong> {validationResult.ticketDetails.ticketId}</p>
              <p><strong>Sahibi:</strong> {validationResult.ticketDetails.owner}</p>
              
              <button 
                onClick={handleMarkAsUsed}
                className="mark-used-button"
                disabled={validating}
              >
                {validating ? 'İşleniyor...' : 'Kullanıldı Olarak İşaretle'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
