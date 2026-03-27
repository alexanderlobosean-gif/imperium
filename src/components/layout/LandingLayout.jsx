import React from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const LandingLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default LandingLayout
