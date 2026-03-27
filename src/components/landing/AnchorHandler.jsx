import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const AnchorHandler = () => {
  const location = useLocation()

  useEffect(() => {
    // Se tiver hash na URL, rolar para a âncora
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      
      if (element) {
        // Pequeno delay para garantir que a página carregou
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)
      }
    }
  }, [location.hash])

  return null
}

export default AnchorHandler
