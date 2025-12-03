import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CabecalhoRodapeLoja } from '@/components/loja/CabecalhoRodapeLoja'

export default function ErroPedido() {
  const location = useLocation()
  const navigate = useNavigate()
  const mensagemErro = (location.state as { mensagemErro?: string })?.mensagemErro || 'Ocorreu um erro ao processar seu pedido.'

  return (
    <CabecalhoRodapeLoja revendaId={null} unidadeId={null}>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        {/* Header de Erro */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              {/* Círculo de fundo animado */}
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-pulse"></div>
              {/* Ícone de erro */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Erro no Pedido
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Não foi possível processar seu pedido
            </p>
          </div>
        </div>

        {/* Card de Erro */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              Detalhes do Erro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-neutral-700 dark:text-neutral-300">
              {mensagemErro}
            </p>
          </CardContent>
        </Card>

        {/* Botão de Ação */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Painel
          </Button>
        </div>
      </div>
    </CabecalhoRodapeLoja>
  )
}















