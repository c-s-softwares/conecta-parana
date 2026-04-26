import { useState } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import Problema from './components/sections/Problema'
import Overview from './components/sections/Overview'
import Gov from './components/sections/Gov'
import Citizen from './components/sections/Citizen'
import Scale from './components/sections/Scale'
import Stack from './components/sections/Stack'
import CtaFinal from './components/sections/CtaFinal'
import ContactModal from './components/ui/ContactModal'
import Toast from './components/ui/Toast'

export default function App() {
  const [contactOpen, setContactOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  function handleSuccess() {
    setContactOpen(false)
    setToastVisible(true)
  }

  return (
    <>
      <Navbar onOpenContact={() => setContactOpen(true)} />
      <main>
        <Hero />
        <Problema />
        <Overview />
        <Gov />
        <Citizen />
        <Scale />
        <Stack />
        <CtaFinal onOpenContact={() => setContactOpen(true)} />
      </main>
      <Footer />

      {contactOpen && (
        <ContactModal
          onClose={() => setContactOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      <Toast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  )
}
