import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Event Planner',
  description: 'Закрытое планирование мероприятий для организаторов и приглашённых участников.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ru' className={cn('font-sans', geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
