import { StrictMode, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './config/wagmi'

const queryClient = new QueryClient()

// Disclaimer bileşeni için tip tanımlama
type DisclaimerProps = {
  Text: React.FC<{ children: ReactNode }>
  Link: React.FC<{ href: string; children: ReactNode }>
}

// Disclaimer bileşeni
const Disclaimer = ({ Text, Link }: DisclaimerProps) => (
  <Text>
    Bu uygulama eğitim amaçlıdır. Kendi sorumluluğunuzda kullanın.{' '}
    <Link href="https://github.com/yourusername/BC-EventCard">Daha fazla bilgi</Link>
  </Text>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          modalSize="compact"
          appInfo={{
            appName: 'BC-EventCard',
            disclaimer: Disclaimer
          }}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
