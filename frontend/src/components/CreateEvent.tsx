import { useState } from 'react'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'

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

export function CreateEvent() {
  const { address, chain } = useAccount()
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    price: '',
    maxTickets: '',
    metadataBase: 'ipfs://QmDefaultCID' // Varsayılan IPFS CID
  })
  
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError(null) // Her değişiklikte hata mesajını temizle
  }

  // localStorage'den mevcut etkinlikleri alır
  const getExistingEvents = (): Event[] => {
    const eventsString = localStorage.getItem('events')
    return eventsString ? JSON.parse(eventsString) : []
  }

  // localStorage'e yeni etkinlik ekler
  const saveEventToLocalStorage = (newEvent: Event) => {
    const existingEvents = getExistingEvents()
    const updatedEvents = [...existingEvents, newEvent]
    localStorage.setItem('events', JSON.stringify(updatedEvents))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Temel form doğrulama
    if (!formData.name.trim()) {
      return setFormError("Etkinlik adı gereklidir")
    }
    
    if (!formData.date) {
      return setFormError("Etkinlik tarihi gereklidir")
    }
    
    const eventDate = new Date(formData.date).getTime() / 1000
    if (eventDate <= Date.now() / 1000) {
      return setFormError("Etkinlik tarihi gelecekte olmalıdır")
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      return setFormError("Geçerli bir bilet fiyatı giriniz")
    }
    
    if (!formData.maxTickets || parseInt(formData.maxTickets) <= 0) {
      return setFormError("Geçerli bir maksimum bilet sayısı giriniz")
    }
    
    // Simülasyon: İşlem başlatma
    setIsProcessing(true)
    
    // Yeni etkinlik için özgün ID oluştur
    const existingEvents = getExistingEvents()
    const nextId = existingEvents.length > 0 
      ? BigInt(Number(existingEvents[existingEvents.length - 1].id) + 1)
      : BigInt(existingEvents.length + 1)
    
    try {
      // Yeni etkinlik nesnesi oluştur
      const newEvent: Event = {
        id: nextId,
        name: formData.name,
        date: BigInt(Math.floor(eventDate)),
        price: parseEther(formData.price),
        maxTickets: BigInt(parseInt(formData.maxTickets)),
        soldTickets: BigInt(0), // Başlangıçta satılan bilet yok
        active: true,
        organizer: address || "0x0000000000000000000000000000000000000000",
        metadataBase: formData.metadataBase
      }
      
      // localStorage'e kaydet
      saveEventToLocalStorage(newEvent)
      
      // 2 saniye sonra işlem tamamlandı göster
      setTimeout(() => {
        setIsProcessing(false)
        setIsSuccess(true)
        
        // Form verilerini temizle
        setFormData({
          name: '',
          date: '',
          price: '',
          maxTickets: '',
          metadataBase: 'ipfs://QmDefaultCID'
        })
        
        // 5 saniye sonra başarı mesajını kaldır
        setTimeout(() => setIsSuccess(false), 5000)
      }, 2000)
    } catch (error) {
      setIsProcessing(false)
      setFormError("Etkinlik oluşturulurken bir hata oluştu.")
      console.error("Etkinlik oluşturma hatası:", error)
    }
  }

  // Cüzdan bağlı değilse
  if (!address) {
    return (
      <div className="create-event">
        <h2>Etkinlik Oluştur</h2>
        <p className="warning">Etkinlik oluşturmak için cüzdanınızı bağlamanız gerekiyor.</p>
      </div>
    )
  }

  return (
    <div className="create-event">
      <h2>Yeni Etkinlik Oluştur</h2>
      
      {isSuccess && (
        <div className="success-message">
          Etkinlik başarıyla oluşturuldu! Etkinlikler listesinde görüntüleyebilirsiniz.
        </div>
      )}
      
      {formError && (
        <div className="error-message">
          {formError}
        </div>
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
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isProcessing}
          className="primary-button"
        >
          {isProcessing ? "İşlem Sürüyor..." : "Etkinlik Oluştur"}
        </button>
      </form>
    </div>
  )
} 