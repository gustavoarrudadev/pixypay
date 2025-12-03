import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface TelaErroAnimadaProps {
  mensagemErro?: string
  onCompletarAnimacao?: () => void
}

export function TelaErroAnimada({ mensagemErro, onCompletarAnimacao }: TelaErroAnimadaProps) {
  const [mostrarTransicao, setMostrarTransicao] = useState(true)
  const [saindoTransicao, setSaindoTransicao] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Mostra a tela de transição por 2.5 segundos, depois anima a saída
    const timerTransicao = setTimeout(() => {
      setSaindoTransicao(true)
      // Após a animação de saída completar, remove a tela e chama callback
      setTimeout(() => {
        setMostrarTransicao(false)
        if (onCompletarAnimacao) {
          onCompletarAnimacao()
        } else {
          // Redireciona para página de erro com a mensagem
          navigate('/cliente/erro-pedido', {
            state: { mensagemErro: mensagemErro || 'Ocorreu um erro ao processar seu pedido.' }
          })
        }
      }, 800) // Tempo da animação de saída
    }, 2500)
    
    return () => {
      clearTimeout(timerTransicao)
    }
  }, [mensagemErro, navigate, onCompletarAnimacao])

  if (!mostrarTransicao) return null

  return (
    <div 
      className={`fixed inset-0 z-50 bg-gradient-to-br from-red-800 via-red-900 to-red-950 flex items-center justify-center ${
        saindoTransicao ? 'animate-slide-circular-out' : 'animate-slide-circular-in'
      }`}
    >
      <div className="text-center space-y-4 animate-fade-in px-4 -mt-20">
        <div className="flex justify-center">
          <div className="relative">
            {/* Animação Lottie via iframe - roda uma única vez */}
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-0">
              <iframe
                src="https://lottie.host/embed/2151f0da-9eb3-4d39-88cc-1fed4e0acb8d/Nurkm4Y6Lc.lottie?autoplay=true&loop=false"
                className="w-full h-full border-0"
                title="Erro"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-white animate-fade-in-up">
            Ops, algo deu errado
          </h2>
          <p className="text-red-100 text-base sm:text-lg animate-fade-in-up-delay">
            Redirecionando...
          </p>
        </div>
      </div>
    </div>
  )
}

