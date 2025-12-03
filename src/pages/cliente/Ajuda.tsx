import { HelpCircle, MessageCircle, BookOpen, CreditCard, ShoppingBag, User, Shield, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'

/**
 * Página de Ajuda - Cliente
 * 
 * FAQ completo da Pixy Pay com documentação, guias e informações de contato.
 */
export default function Ajuda() {
  const whatsappNumber = '5511999999999' // Substitua pelo número real do WhatsApp da Pixy Pay
  const whatsappMessage = encodeURIComponent('Olá! Preciso de ajuda com a Pixy Pay.')

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')
  }

  const faqItems = [
    {
      titulo: 'O que é a Pixy Pay?',
      conteudo: (
        <div className="space-y-2">
          <p>
            A Pixy Pay é uma plataforma completa de e-commerce que conecta clientes a lojas físicas e online. 
            Nossa missão é facilitar a compra e venda de produtos, oferecendo uma experiência segura, rápida e intuitiva.
          </p>
          <p>
            Com a Pixy Pay, você pode:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Explorar produtos de diversas lojas parceiras</li>
            <li>Fazer pedidos online de forma segura</li>
            <li>Parcelar suas compras em até 3x usando PIX Parcelado</li>
            <li>Agendar entregas conforme sua conveniência</li>
            <li>Gerenciar seus pedidos e pagamentos em um só lugar</li>
          </ul>
        </div>
      )
    },
    {
      titulo: 'Como criar uma conta?',
      conteudo: (
        <div className="space-y-2">
          <p>Para criar sua conta na Pixy Pay:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Clique em "Entrar" no canto superior direito</li>
            <li>Selecione "Criar conta"</li>
            <li>Preencha seus dados pessoais (nome, e-mail, telefone)</li>
            <li>Crie uma senha segura</li>
            <li>Confirme seu e-mail através do link enviado</li>
            <li>Pronto! Você já pode começar a comprar</li>
          </ol>
        </div>
      )
    },
    {
      titulo: 'Como fazer um pedido?',
      conteudo: (
        <div className="space-y-2">
          <p>Fazer um pedido na Pixy Pay é muito simples:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Navegue pelas lojas disponíveis e encontre os produtos desejados</li>
            <li>Clique em "Adicionar ao carrinho" nos produtos que deseja comprar</li>
            <li>Acesse seu carrinho e revise os itens selecionados</li>
            <li>Clique em "Finalizar Compra"</li>
            <li>Escolha o endereço de entrega ou cadastre um novo</li>
            <li>Selecione a forma de pagamento (à vista ou parcelado)</li>
            <li>Se optar por parcelamento, escolha o número de parcelas</li>
            <li>Confirme o pedido</li>
            <li>Você receberá um e-mail de confirmação com os detalhes do pedido</li>
          </ol>
        </div>
      )
    },
    {
      titulo: 'Quais formas de pagamento são aceitas?',
      conteudo: (
        <div className="space-y-2">
          <p>A Pixy Pay aceita as seguintes formas de pagamento:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>PIX:</strong> Pagamento instantâneo com desconto</li>
            <li><strong>Cartão de Crédito:</strong> Visa, Mastercard, Elo, Amex</li>
            <li><strong>PIX Parcelado:</strong> Em até 3x sem juros usando PIX</li>
            <li><strong>Boleto Bancário:</strong> Vencimento em até 3 dias úteis</li>
          </ul>
          <p className="mt-2">
            <strong>Importante:</strong> As opções de pagamento podem variar conforme a loja escolhida.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como funciona o parcelamento?',
      conteudo: (
        <div className="space-y-2">
          <p>O parcelamento permite dividir o valor da sua compra em várias parcelas usando PIX:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Você pode parcelar em até 3x sem juros usando PIX Parcelado</li>
            <li>Cada parcela será cobrada mensalmente via PIX</li>
            <li>O parcelamento é feito exclusivamente através da modalidade PIX Parcelado</li>
            <li>Não é necessário cartão de crédito para parcelar</li>
            <li>Você pode acompanhar o status de cada parcela na seção "Parcelamentos"</li>
            <li>É possível dar baixa manual em parcelas pagas ou marcar como vencidas</li>
            <li>Você receberá lembretes antes do vencimento de cada parcela</li>
          </ul>
          <p className="mt-2">
            <strong>Dica:</strong> Mantenha seus dados de pagamento atualizados para evitar problemas no parcelamento.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como agendar uma entrega?',
      conteudo: (
        <div className="space-y-2">
          <p>Algumas lojas oferecem a opção de agendar entregas:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Durante o checkout, selecione a opção "Agendar entrega"</li>
            <li>Escolha a data desejada (conforme disponibilidade da loja)</li>
            <li>Selecione o horário de preferência</li>
            <li>Adicione observações, se necessário (ex: "deixar na portaria")</li>
            <li>Confirme o agendamento</li>
          </ol>
          <p className="mt-2">
            Você pode gerenciar seus agendamentos na seção "Meus Pedidos" e receberá lembretes antes da data agendada.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como acompanhar meus pedidos?',
      conteudo: (
        <div className="space-y-2">
          <p>Para acompanhar seus pedidos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse o menu "Meus Pedidos" ou "Minhas Compras"</li>
            <li>Visualize todos os seus pedidos com seus respectivos status</li>
            <li>Clique em "Ver Detalhes" para mais informações sobre um pedido específico</li>
            <li>Você verá o histórico completo, incluindo data, valor, produtos e status de entrega</li>
          </ol>
          <p className="mt-2">
            <strong>Status possíveis:</strong> Agendado, Confirmado, Em Preparação, Em Trânsito, Entregue, Cancelado
          </p>
        </div>
      )
    },
    {
      titulo: 'Como favoritar uma loja?',
      conteudo: (
        <div className="space-y-2">
          <p>Para favoritar uma loja e ter acesso rápido:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse a página pública da loja</li>
            <li>Clique no ícone de coração no cabeçalho da loja</li>
            <li>A loja será adicionada aos seus favoritos</li>
            <li>Acesse "Meus Favoritos" para ver todas as lojas favoritadas</li>
            <li>Clique em "Visitar Loja" para acessar rapidamente</li>
          </ol>
          <p className="mt-2">
            Você pode remover uma loja dos favoritos a qualquer momento clicando em "Remover dos Favoritos".
          </p>
        </div>
      )
    },
    {
      titulo: 'O que fazer se uma parcela estiver atrasada?',
      conteudo: (
        <div className="space-y-2">
          <p>Se você tem parcelas atrasadas:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Acesse a seção "Negociações" no seu painel</li>
            <li>Visualize todas as parcelas atrasadas</li>
            <li>Entre em contato com a loja através dos meios disponíveis</li>
            <li>Negocie uma solução para regularizar o pagamento</li>
            <li>Após o pagamento, a parcela será atualizada automaticamente</li>
          </ul>
          <p className="mt-2">
            <strong>Importante:</strong> Parcelas atrasadas podem afetar sua capacidade de fazer novos pedidos. 
            Mantenha seus pagamentos em dia.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como atualizar meus dados pessoais?',
      conteudo: (
        <div className="space-y-2">
          <p>Para atualizar seus dados:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Gerenciar Conta" no menu</li>
            <li>Edite as informações desejadas (nome, e-mail, telefone)</li>
            <li>Altere sua senha, se necessário</li>
            <li>Atualize seus endereços de entrega</li>
            <li>Salve as alterações</li>
          </ol>
          <p className="mt-2">
            <strong>Segurança:</strong> Mantenha seus dados atualizados para garantir a segurança da sua conta e facilitar o processo de entrega.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como cancelar um pedido?',
      conteudo: (
        <div className="space-y-2">
          <p>Para cancelar um pedido:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Acesse "Meus Pedidos"</li>
            <li>Localize o pedido que deseja cancelar</li>
            <li>Clique em "Ver Detalhes"</li>
            <li>Se o pedido ainda estiver em status "Agendado" ou "Confirmado", você verá a opção "Cancelar Pedido"</li>
            <li>Confirme o cancelamento</li>
          </ol>
          <p className="mt-2">
            <strong>Importante:</strong> Pedidos já em preparação ou em trânsito não podem ser cancelados automaticamente. 
            Nesses casos, entre em contato com a loja diretamente.
          </p>
        </div>
      )
    },
    {
      titulo: 'Minha conta está bloqueada. O que fazer?',
      conteudo: (
        <div className="space-y-2">
          <p>Se sua conta estiver bloqueada:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Verifique se há parcelas em atraso</li>
            <li>Entre em contato com a Pixy Pay através do WhatsApp</li>
            <li>Regularize qualquer pendência financeira</li>
            <li>Aguarde a análise e desbloqueio da conta</li>
          </ul>
          <p className="mt-2">
            <strong>Dica:</strong> Mantenha seus pagamentos em dia para evitar bloqueios.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como funciona a segurança dos dados?',
      conteudo: (
        <div className="space-y-2">
          <p>A Pixy Pay leva a segurança muito a sério:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Todos os dados são criptografados</li>
            <li>Pagamentos são processados por gateways seguros</li>
            <li>Não armazenamos dados completos de cartão de crédito</li>
            <li>Seus dados pessoais são protegidos conforme a LGPD</li>
            <li>Você tem controle total sobre suas informações</li>
          </ul>
          <p className="mt-2">
            <strong>Recomendação:</strong> Use senhas fortes e não compartilhe suas credenciais de acesso.
          </p>
        </div>
      )
    },
    {
      titulo: 'Como entrar em contato com o suporte?',
      conteudo: (
        <div className="space-y-2">
          <p>Você pode entrar em contato conosco através de:</p>
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
          Central de Ajuda
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Encontre respostas para suas dúvidas e aprenda a usar a Pixy Pay
        </p>
      </div>

      {/* Contato WhatsApp */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-50">
                  Precisa de ajuda?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Fale conosco pelo WhatsApp e receba atendimento imediato
                </p>
              </div>
            </div>
            <Button
              onClick={handleWhatsAppClick}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
              <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Conta e Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie sua conta, atualize seus dados e configure preferências
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <ShoppingBag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Aprenda a fazer pedidos, acompanhar entregas e gerenciar compras
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Formas de pagamento, parcelamento e gestão financeira
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-lg">Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Proteção de dados, privacidade e segurança da sua conta
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
            Encontre respostas rápidas para as dúvidas mais comuns sobre a Pixy Pay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion items={faqItems} />
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Política de Privacidade
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              A Pixy Pay respeita sua privacidade e protege seus dados pessoais conforme a LGPD. 
              Seus dados são utilizados apenas para melhorar sua experiência e processar seus pedidos.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Termos de Uso
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Ao usar a Pixy Pay, você concorda com nossos termos de uso. 
              É importante ler e entender as condições antes de fazer pedidos.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Horário de Atendimento
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Nosso atendimento funciona de segunda a sexta-feira, das 9h às 18h. 
              Fora desse horário, você pode deixar uma mensagem e responderemos assim que possível.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
