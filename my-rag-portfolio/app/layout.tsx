import './globals.css';

export const metadata = {
  title: 'Azure GenAI Workbench',
  description: 'RAG Architecture Portfolio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">
        {children}
      </body>
    </html>
  )
}