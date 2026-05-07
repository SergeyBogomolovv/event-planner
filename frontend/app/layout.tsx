import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Event Planner',
  description: 'Closed event planning for organizers and invited participants.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ru'>
      <body>{children}</body>
    </html>
  )
}
