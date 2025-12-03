import { HelpCircle, MessageCircle, BookOpen, Shield, Settings, Users, Store, DollarSign, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'

/**
 * Página de Ajuda - Admin
 * 
 * FAQ completo voltado para administradores da plataforma.
 */
export default function AjudaAdmin() {
  const whatsappNumber = '5511999999999' // Substitua pelo número real do WhatsApp da Pixy Pay
  const whatsappMessage = encodeURIComponent('Olá! Preciso de ajuda com o painel administrativo da Pixy Pay.')

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')
  }

  const faqItems = [
    {
      titulo: 'Como gerenciar revendas?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar revendas na plataforma:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Revendas" no painel administrativo</li>
            <li>Visualize todas as revendas cadastradas</li>
            <li>Clique em uma revenda para ver detalhes completos</li>
            <li>Edite informações, configure taxas e modalidades de repasse</li>
            <li>Monitore o desempenho e estatísticas de cada revenda</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use os filtros para encontrar revendas específicas rapidamente.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como configurar taxas de repasse?',
      conteudo: (
        <div className="space-y-2">
          <p>Para configurar taxas de repasse:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Financeiro" no menu administrativo</li>
            <li>Use a seção "Configuração de Taxas em Massa" para alterar taxas de todas as modalidades</li>
            <li>Ou acesse os detalhes de uma revenda específica para configurar taxas individuais</li>
            <li>Configure percentual e valor fixo (em centavos) para cada modalidade</li>
            <li>Salve as alterações</li>
          </ol>
          <p className="mt-2">
            <strong>Importante:</strong> As taxas configuradas serão aplicadas a novos pedidos. Pedidos já processados não são afetados.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como criar um repasse?',
      conteudo: (
        <div className="space-y-2">
          <p>Para criar um repasse para uma revenda:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Repasses" no menu administrativo</li>
            <li>Visualize as transações liberadas para repasse</li>
            <li>Selecione as transações que deseja incluir no repasse</li>
            <li>Clique em "Criar Repasse"</li>
            <li>O sistema agrupará automaticamente por revenda</li>
            <li>Confirme a criação do repasse</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Você pode antecipar repasses ou reverter antecipações quando necessário.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como monitorar inadimplência?',
      conteudo: (
        <div className="space-y-2">
          <p>Para monitorar inadimplência:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Inadimplência" no menu administrativo</li>
            <li>Visualize métricas gerais: clientes inadimplentes, pedidos, parcelas atrasadas</li>
            <li>Use filtros para analisar por revenda ou período</li>
            <li>Visualize detalhes de cada inadimplência</li>
            <li>Entre em contato com clientes quando necessário</li>
          </ol>
          <p className="mt-2">
            <strong>Importante:</strong> Mantenha-se atualizado sobre inadimplências para tomar ações preventivas.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerenciar clientes?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar clientes:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Clientes" no menu administrativo</li>
            <li>Visualize todos os clientes cadastrados</li>
            <li>Use filtros para encontrar clientes específicos</li>
            <li>Clique em um cliente para ver detalhes completos</li>
            <li>Edite informações, banir/desbanir clientes quando necessário</li>
            <li>Visualize histórico de pedidos e parcelamentos</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use a aba "Favoritos" para ver quais clientes favoritaram cada revenda.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como visualizar métricas financeiras?',
      conteudo: (
        <div className="space-y-2">
          <p>Para visualizar métricas financeiras:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Financeiro" no menu administrativo</li>
            <li>Visualize cards com métricas principais: receita total, transações, repasses</li>
            <li>Use filtros avançados por período, revenda, status ou modalidade</li>
            <li>Analise gráficos de distribuição por modalidade e top revendas</li>
            <li>Exporte dados quando necessário (funcionalidade futura)</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> As métricas são atualizadas automaticamente quando você entra no menu.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerenciar pedidos?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar pedidos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Pedidos" no menu administrativo</li>
            <li>Visualize todos os pedidos da plataforma</li>
            <li>Use filtros por status, data ou revenda</li>
            <li>Clique em um pedido para ver detalhes completos</li>
            <li>Atualize status de pedidos quando necessário</li>
            <li>Monitore métricas: total de pedidos, entregues, pendentes</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use a visualização em grid ou lista conforme sua preferência.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como funciona o sistema de parcelamentos?',
      conteudo: (
        <div className="space-y-2">
          <p>O sistema de parcelamentos permite:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Visualizar todos os parcelamentos ativos na plataforma</li>
            <li>Monitorar parcelas pagas e pendentes</li>
            <li>Filtrar por revenda específica</li>
            <li>Visualizar detalhes de cada parcelamento e suas parcelas</li>
            <li>Identificar parcelas atrasadas</li>
          </ul>
          <p className="mt-2">
            <strong>Importante:</strong> Parcelamentos são criados automaticamente quando um cliente escolhe PIX Parcelado no checkout.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerenciar agendamentos?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar agendamentos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Agendamentos" no menu administrativo</li>
            <li>Visualize todos os agendamentos de entrega</li>
            <li>Filtre por status: agendado, confirmado, realizado, cancelado</li>
            <li>Monitore métricas: total, agendados, confirmados, realizados</li>
            <li>Visualize detalhes de cada agendamento</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use os filtros de data para visualizar agendamentos futuros ou passados.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como entrar em contato com o suporte técnico?',
      conteudo: (
        <div className="space-y-2">
          <p>Para suporte técnico:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>WhatsApp:</strong> Clique no botão abaixo para falar diretamente conosco</li>
            <li><strong>E-mail:</strong> suporte@pixypay.com.br</li>
            <li><strong>Horário de atendimento:</strong> Segunda a Sexta, das 9h às 18h</li>
          </ul>
          <p className="mt-2">
            Estamos sempre prontos para ajudar você!
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <HelpCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Central de Ajuda - Admin
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Encontre respostas para suas dúvidas sobre o painel administrativo
        </p>
      </div>

      {/* Contato WhatsApp */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                  Precisa de ajuda?
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Fale conosco pelo WhatsApp e receba atendimento imediato
                </p>
              </div>
            </div>
            <Button
              onClick={handleWhatsAppClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar no WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seções de Informações */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Revendas</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie revendas, configure taxas e monitore desempenho
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie repasses, configure taxas e monitore receitas
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Monitore e gerencie clientes e parcelas inadimplentes
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure taxas, modalidades e outras configurações do sistema
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
          </div>
          <CardDescription>
            Encontre respostas rápidas para as dúvidas mais comuns sobre o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion items={faqItems} />
        </CardContent>
      </Card>
    </div>
  )
}

