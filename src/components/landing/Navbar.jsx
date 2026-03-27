import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <img 
                  src="/icone.png" 
                  alt="Imperium Club" 
                  className="w-10 h-10 mr-3"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                    IMPERIUM
                  </h1>
                  <p className="text-xs text-slate-600 -mt-1">CLUB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className="text-slate-700 hover:text-yellow-500 transition-colors duration-200">
                Início
              </Link>
              <Link to="/#about" className="text-slate-700 hover:text-yellow-500 transition-colors duration-200">
                Sobre
              </Link>
              <div className="relative group">
                <button className="text-slate-700 hover:text-yellow-500 transition-colors duration-200 flex items-center">
                  Planos
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/#plans" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-yellow-500">
                    Planos de Investimento
                  </Link>
                  <Link to="/#plans" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-yellow-500">
                    Planos Leadership
                  </Link>
                </div>
              </div>
              <Link to="/#testimonials" className="text-slate-700 hover:text-yellow-500 transition-colors duration-200">
                Depoimentos
              </Link>
              <Link to="/#faq" className="text-slate-700 hover:text-yellow-500 transition-colors duration-200">
                FAQ
              </Link>
              <div className="relative group">
                <button className="text-slate-700 hover:text-yellow-500 transition-colors duration-200 flex items-center">
                  Suporte
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/support" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-yellow-500">
                    Central de Suporte
                  </Link>
                  <Link to="/help-center" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-yellow-500">
                    Ajuda
                  </Link>
                  <Link to="/contact" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-yellow-500">
                    Contato
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <button className="text-slate-700 hover:text-yellow-500 transition-colors duration-200">
                <Link to="/login">Entrar</Link>
              </button>
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                <Link to="/register">Cadastrar</Link>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 hover:text-yellow-500 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md rounded-lg mt-2 p-4 shadow-lg">
            <div className="space-y-2">
              <Link to="/" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                Início
              </Link>
              <Link to="/#about" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                Sobre
              </Link>
              <Link to="/#plans" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                Planos
              </Link>
              <Link to="/#testimonials" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                Depoimentos
              </Link>
              <Link to="/#faq" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                FAQ
              </Link>
              <div className="border-t border-slate-200 pt-2 mt-2">
                <Link to="/support" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                  Central de Suporte
                </Link>
                <Link to="/help-center" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                  Ajuda
                </Link>
                <Link to="/contact" className="block text-slate-700 hover:text-yellow-500 py-2" onClick={() => setIsOpen(false)}>
                  Contato
                </Link>
              </div>
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <Link to="/login" className="block text-slate-700 hover:text-yellow-500 py-2">
                  Entrar
                </Link>
                <Link to="/register" className="block bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 text-center">
                  Cadastrar
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
