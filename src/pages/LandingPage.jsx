import React from 'react'
import Hero from '@/components/landing/Hero'
import DownloadApp from '@/components/landing/DownloadApp'
import VisionMission from '@/components/landing/VisionMission'
import Features from '@/components/landing/Features'
import Plans from '@/components/landing/Plans'
import Testimonials from '@/components/landing/Testimonials'
import FAQ from '@/components/landing/FAQ'
import AnchorHandler from '@/components/landing/AnchorHandler'

const LandingPage = () => {
  return (
    <>
      <AnchorHandler />
      <Hero />
      <DownloadApp />
      <VisionMission />
      <Features />
      <Plans />
      <Testimonials />
      <FAQ />
    </>
  )
}

export default LandingPage
