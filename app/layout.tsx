import './globals.css'
import { Inter } from 'next/font/google'
import Layout from './components/Layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '加密资产管理器',
  description: '管理您的加密钱包、项目和每日任务',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
