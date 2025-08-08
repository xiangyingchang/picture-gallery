type Metadata = { title?: string; description?: string; generator?: string }
import './globals.css'

export const metadata: Metadata = {
  title: 'Template',
  description: 'Design Template',
  generator: 'Codebuddy',
}

import type { ReactNode } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
