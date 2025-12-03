import { HelpCircle, MessageCircle, BookOpen, Package, Store, ShoppingCart, DollarSign, FileText, Users, Calendar, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'

/**
 * Página de Ajuda - Revenda
 * 
 * FAQ completo voltado para revendas da plataforma.
 */
export default function AjudaRevenda() {
  const whatsappNumber = '5511999999999' // Substitua pelo número real do WhatsApp da Pixy Pay
  const whatsappMessage = encodeURIComponent('Olá! Preciso de ajuda com o painel da revenda da Pixy Pay.')

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')
  }

  const faqItems = [
    {
      titulo: 'Como configurar minha loja pública?',
      conteudo: (
        <div className="space-y-2">
          <p>Para configurar sua loja pública:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Presença na Loja" no painel da revenda</li>
            <li>Configure o nome da sua loja, descrição e imagem de capa</li>
            <li>Personalize o link público da sua loja</li>
            <li>Ative ou desative a visibilidade da loja</li>
            <li>Configure informações de contato e endereço</li>
            <li>Salve as alterações</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use uma descrição atrativa e imagens de qualidade para aumentar as vendas.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como adicionar produtos à minha loja?',
      conteudo: (
        <div className="space-y-2">
          <p>Para adicionar produtos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Produtos" no painel da revenda</li>
            <li>Clique em "Novo Produto"</li>
            <li>Preencha as informações: nome, descrição, preço, categoria</li>
            <li>Adicione imagens do produto (mínimo 1, recomendado 3-5)</li>
            <li>Configure estoque e disponibilidade</li>
            <li>Salve o produto</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Produtos com mais imagens e descrições detalhadas vendem mais.
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
            <li>Acesse o menu "Pedidos" no painel da revenda</li>
            <li>Visualize todos os pedidos recebidos</li>
            <li>Use filtros por status, data ou cliente</li>
            <li>Clique em um pedido para ver detalhes completos</li>
            <li>Atualize o status conforme o progresso: Confirmado → Preparando → Pronto → Em Trânsito → Entregue</li>
            <li>Monitore métricas de vendas e ticket médio</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Mantenha os status atualizados para melhorar a experiência do cliente.
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
            <li>Visualizar todos os parcelamentos ativos dos seus clientes</li>
            <li>Monitorar parcelas pagas e pendentes</li>
            <li>Receber pagamentos parcelados via PIX</li>
            <li>Visualizar detalhes de cada parcelamento e suas parcelas</li>
            <li>Identificar parcelas atrasadas</li>
          </ul>
          <p className="mt-2">
            <strong>Importante:</strong> Os parcelamentos são criados automaticamente quando o cliente escolhe PIX Parcelado no checkout. Você recebe o valor total menos as taxas configuradas.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerenciar agendamentos de entrega?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar agendamentos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Agendamentos" no painel da revenda</li>
            <li>Visualize todos os agendamentos de entrega</li>
            <li>Filtre por status: agendado, confirmado, realizado, cancelado</li>
            <li>Confirme agendamentos quando o cliente solicitar</li>
            <li>Monitore métricas: total, agendados, confirmados, realizados</li>
            <li>Visualize detalhes de cada agendamento incluindo endereço e horário</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use os filtros de data para visualizar agendamentos futuros ou passados.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como visualizar minhas métricas financeiras?',
      conteudo: (
        <div className="space-y-2">
          <p>Para visualizar métricas financeiras:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Financeiro" no painel da revenda</li>
            <li>Visualize cards com métricas principais: receita total, transações, repasses</li>
            <li>Use filtros avançados por período, status ou modalidade</li>
            <li>Analise gráficos de distribuição por modalidade</li>
            <li>Visualize histórico de repasses recebidos</li>
            <li>Monitore transações pendentes, liberadas e repassadas</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> As métricas são atualizadas automaticamente quando você entra no menu.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerenciar meus clientes?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerenciar clientes:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Clientes" no painel da revenda</li>
            <li>Visualize todos os clientes que compraram da sua loja</li>
            <li>Use filtros para encontrar clientes específicos</li>
            <li>Clique em um cliente para ver detalhes completos</li>
            <li>Visualize histórico de pedidos e parcelamentos de cada cliente</li>
            <li>Monitore clientes recorrentes e novos clientes</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use a busca para encontrar clientes rapidamente pelo nome ou e-mail.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como gerar relatórios?',
      conteudo: (
        <div className="space-y-2">
          <p>Para gerar relatórios:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Relatório" no painel da revenda</li>
            <li>Escolha entre relatórios padrão ou o criador de relatórios</li>
            <li>Use filtros avançados por período, status, forma de pagamento, etc.</li>
            <li>Visualize KPIs de vendas, produtos, clientes, financeiro e parcelamentos</li>
            <li>No criador, selecione campos e métricas específicas</li>
            <li>Visualize preview em tempo real</li>
            <li>Exporte relatórios em CSV quando necessário</li>
          </ol>
          <p className="mt-2">
            <strong>Dica:</strong> Use o criador de relatórios para análises personalizadas e detalhadas.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como funciona o histórico de vendas?',
      conteudo: (
        <div className="space-y-2">
          <p>O histórico de vendas permite:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Visualizar todas as vendas realizadas</li>
            <li>Filtrar por período, status ou cliente</li>
            <li>Ver detalhes completos de cada venda</li>
            <li>Analisar tendências e padrões de vendas</li>
            <li>Exportar dados quando necessário</li>
          </ul>
          <p className="mt-2">
            <strong>Dica:</strong> Use os filtros de data para analisar períodos específicos e identificar tendências.
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
          Central de Ajuda - Revenda
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Encontre respostas para suas dúvidas sobre o painel da revenda
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
            <CardTitle className="text-lg">Loja Pública</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure sua loja pública e personalize sua presença online
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie produtos, estoque e disponibilidade
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie pedidos, atualize status e monitore vendas
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
              Monitore receitas, repasses e transações financeiras
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
            Encontre respostas rápidas para as dúvidas mais comuns sobre o painel da revenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion items={faqItems} />
        </CardContent>
      </Card>
    </div>
  )
}

