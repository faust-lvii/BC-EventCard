# Blockchain Etkinlik Kartları

Bu proje, blockchain teknolojisini kullanarak benzersiz, şifreli ve doğrulanabilir etkinlik kartları oluşturmak için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- Blockchain tabanlı kart oluşturma
- Benzersiz ve şifreli QR kod üretimi
- Kart doğrulama sistemi
- Kullanıcı dostu arayüz

## Gereksinimler

- Python 3.7 veya üzeri
- Flask
- Web3
- QRCode
- Pillow
- Cryptography

## Kurulum

1. Proje klasörüne gidin:
```
cd testproject
```

2. Gerekli paketleri yükleyin:
```
pip install -r requirements.txt
```

3. Uygulamayı çalıştırın:
```
python app.py
```

4. Tarayıcınızda `http://localhost:5000` adresine giderek uygulamayı kullanmaya başlayın.

## Kullanım

### Kart Oluşturma

1. "Kart Oluştur" sayfasına gidin
2. Etkinlik bilgilerini girin (etkinlik adı, tarihi, yeri, katılımcı adı, bilet türü)
3. "Kart Oluştur" düğmesine tıklayın
4. Oluşturulan kartı yazdırabilir veya doğrulama kodunu kaydedebilirsiniz

### Kart Doğrulama

1. "Kart Doğrula" sayfasına gidin
2. QR kodu tarayın veya doğrulama kodunu girin
3. "Kartı Doğrula" düğmesine tıklayın
4. Doğrulama sonucunu görüntüleyin

## Teknik Detaylar

Bu uygulama, basit bir blockchain yapısı kullanarak her kartın benzersiz ve doğrulanabilir olmasını sağlar. Kartlar şifrelenir ve QR kodlar aracılığıyla doğrulanabilir. Gerçek bir blockchain ağı yerine, demo amaçlı basit bir blockchain simülasyonu kullanılmıştır.

## Güvenlik

- Her kart için benzersiz bir kimlik oluşturulur
- Veriler şifrelenir ve QR kod içinde saklanır
- Blockchain yapısı, kartın değiştirilmesini önler

## Geliştirme

Bu proje, gerçek bir blockchain ağına (Ethereum, Binance Smart Chain vb.) bağlanacak şekilde geliştirilebilir. Ayrıca, daha gelişmiş doğrulama mekanizmaları ve kullanıcı yönetimi eklenebilir.
