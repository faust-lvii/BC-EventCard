import { useState } from 'react'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { Button } from '../ui/Button'
import { Alert, AlertType } from '../ui/Alert'
import { eventManagerABI } from '../contracts/abis/eventManagerABI'
import { EVENT_MANAGER_ADDRESS } from '../config/contractAddresses'
import { useContractWrite, useWaitForTransaction } from '../lib/wagmiAdapter'

// Etkinlik arayüzü tanımı
export interface Event {
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

// Form interface
interface EventFormData {
  name: string;
  date: string;
  price: string;
  maxTickets: string;
  metadataBase: string;
}

export function CreateEvent() {
  const { isConnected } = useAccount()
  
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    price: '',
    maxTickets: '',
    metadataBase: 'ipfs://QmDefaultCID'
  })
  
  const [formError, setFormError] = useState<string | null>(null)
  
  // Contract interaction setup
  const { writeAsync: createEvent, data: createEventData } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'createEvent',
  })
  
  // Wait for transaction to complete
  const { 
    isLoading: isProcessing, 
    isSuccess 
  } = useWaitForTransaction({
    hash: createEventData,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Form validation
    if (!formData.name.trim()) {
      return setFormError("Etkinlik adı gereklidir")
    }
    
    if (!formData.date) {
      return setFormError("Etkinlik tarihi gereklidir")
    }
    
    const eventDateTimestamp = Math.floor(new Date(formData.date).getTime() / 1000)
    if (eventDateTimestamp <= Date.now() / 1000) {
      return setFormError("Etkinlik tarihi gelecekte olmalıdır")
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      return setFormError("Geçerli bir bilet fiyatı giriniz")
    }
    
    if (!formData.maxTickets || parseInt(formData.maxTickets) <= 0) {
      return setFormError("Geçerli bir maksimum bilet sayısı giriniz")
    }
    
    try {
      // Create the event on the blockchain
      await createEvent({
        args: [
          formData.name,
          BigInt(eventDateTimestamp),
          parseEther(formData.price),
          BigInt(parseInt(formData.maxTickets)),
          formData.metadataBase
        ]
      })
    } catch (error) {
      console.error("Etkinlik oluşturma hatası:", error)
      setFormError("Etkinlik oluşturulurken bir hata oluştu.")
    }
  }

  // If wallet is not connected
  if (!isConnected) {
    return (
      <div className="create-event">
        <h2>Etkinlik Oluştur</h2>
        <Alert 
          type={AlertType.WARNING} 
          message="Etkinlik oluşturmak için cüzdanınızı bağlamanız gerekiyor." 
        />
      </div>
    )
  }

  return (
    <div className="create-event">
      <h2>Yeni Etkinlik Oluştur</h2>
      
      {isSuccess && (
        <Alert
          type={AlertType.SUCCESS}
          message="Etkinlik başarıyla oluşturuldu! Etkinlikler listesinde görüntüleyebilirsiniz."
          autoClose={true}
          duration={5000}
        />
      )}
      
      {formError && (
        <Alert
          type={AlertType.ERROR}
          message={formError}
          onClose={() => setFormError(null)}
        />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Etkinlik Adı</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Etkinlik adını girin"
            disabled={isProcessing}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Etkinlik Tarihi</label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={isProcessing}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Bilet Fiyatı (ETH)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.01"
            step="0.000000000000000001"
            min="0"
            disabled={isProcessing}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="maxTickets">Maksimum Bilet Sayısı</label>
          <input
            type="number"
            id="maxTickets"
            name="maxTickets"
            value={formData.maxTickets}
            onChange={handleChange}
            placeholder="100"
            min="1"
            disabled={isProcessing}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="metadataBase">Metadata Base URI (IPFS)</label>
          <input
            type="text"
            id="metadataBase"
            name="metadataBase"
            value={formData.metadataBase}
            onChange={handleChange}
            placeholder="ipfs://CID"
            disabled={isProcessing}
          />
          <small className="form-help">
            Etkinlik bilgileri ve görselleri için IPFS CID'sini giriniz. Örnek: ipfs://QmYourCID
          </small>
        </div>
        
        <Button 
          type="submit" 
          disabled={isProcessing}
          loading={isProcessing}
          variant="primary"
          fullWidth
        >
          Etkinlik Oluştur
        </Button>
      </form>
      
      {/* Form guide */}
      <div className="form-guide">
        <h3>IPFS Metadata Formatı</h3>
        <p>
          Etkinlik metadatasının aşağıdaki şemaya uygun olması önerilir:
        </p>
        <pre>
{`{
  "name": "Etkinlik Adı",
  "description": "Etkinlik açıklaması",
  "image": "ipfs://QmImageCID",
  "external_url": "https://your-site.com/event",
  "attributes": [
    { "trait_type": "Yer", "value": "Etkinlik Mekanı" },
    { "trait_type": "Kategori", "value": "Müzik" }
  ]
}`}
        </pre>
      </div>
    </div>
  )
} 