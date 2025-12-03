import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { obterSessao } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { Loader2 } from 'lucide-react'

/**
 * Página especial para visualização como cliente (impersonation)
 * Acessível apenas via token gerado por admin
 * Usa localStorage para modo de impersonation temporário
 */
export default function VisualizarClientePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    processarToken()
  }, [])

  const processarToken = async () => {
    try {
      const token = searchParams.get('token')
      if (!token) {
        navigate('/admin')
        return
      }

      // Decodifica o token
      let dadosToken: {
        clienteUserId: string
        clienteId: string
        adminUserId: string
        timestamp: number
      }

      try {
        dadosToken = JSON.parse(atob(token))
      } catch {
        navigate('/admin')
        return
      }

      // Verifica se o token não expirou (válido por 1 hora)
      const agora = Date.now()
      const umaHora = 60 * 60 * 1000
      if (agora - dadosToken.timestamp > umaHora) {
        navigate('/admin')
        return
      }

      // Verifica se o usuário atual é admin
      const session = await obterSessao()
      if (!session?.user) {
        navigate('/admin')
        return
      }

      const role = obterRoleDeUsuario(session.user)
      if (role !== 'admin') {
        navigate('/admin')
        return
      }

      // Verifica se o admin que gerou o token é o mesmo logado
      if (session.user.id !== dadosToken.adminUserId) {
        navigate('/admin')
        return
      }

      // Armazena informações de impersonation no localStorage
      // Isso permite que a aplicação detecte que está em modo impersonation
      localStorage.setItem('impersonation_mode', JSON.stringify({
        clienteUserId: dadosToken.clienteUserId,
        clienteId: dadosToken.clienteId,
        adminUserId: dadosToken.adminUserId,
        timestamp: dadosToken.timestamp,
      }))

      // Redireciona para a área do cliente
      // O sistema detectará o modo impersonation e permitirá acesso
      navigate('/cliente')
    } catch (error) {
      console.error('❌ Erro ao processar token:', error)
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Carregando visualização como cliente...
        </p>
      </div>
    </div>
  )
}

