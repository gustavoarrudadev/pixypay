import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12">
      <ThemeToggle />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/registro">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex justify-center flex-1">
            <Logo variant="full" width={120} height={40} />
          </div>
          <div className="w-[100px]"></div> {/* Spacer para centralizar */}
        </div>

        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  Termos de Uso
                </CardTitle>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              {/* Introdução */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  1. Introdução
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Bem-vindo ao Pixy Pay! Estes Termos de Uso ("Termos") regem o uso da plataforma 
                  Pixy Pay ("Plataforma", "Serviço", "nós", "nosso") por você ("Usuário", "você", "seu"). 
                  Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a 
                  estes Termos. Se você não concordar com qualquer parte destes Termos, não deve usar 
                  nossa plataforma.
                </p>
              </section>

              {/* Aceitação dos Termos */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  2. Aceitação dos Termos
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Ao criar uma conta, fazer login ou usar qualquer funcionalidade da plataforma Pixy Pay, 
                  você confirma que:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Você leu, entendeu e concorda com estes Termos de Uso</li>
                  <li>Você tem pelo menos 18 anos de idade ou possui autorização legal</li>
                  <li>Você tem capacidade legal para celebrar contratos</li>
                  <li>Você fornecerá informações precisas e atualizadas</li>
                </ul>
              </section>

              {/* Descrição do Serviço */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  3. Descrição do Serviço
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  O Pixy Pay é uma plataforma de gestão multi-nicho que conecta revendas e clientes, 
                  oferecendo funcionalidades como:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Gestão de produtos e pedidos</li>
                  <li>Sistema de parcelamentos e agendamentos</li>
                  <li>Processamento de pagamentos e repasses</li>
                  <li>Comunicação entre revendas e clientes</li>
                  <li>Relatórios e análises de negócio</li>
                </ul>
              </section>

              {/* Conta de Usuário */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  4. Conta de Usuário
                </h2>
                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2 mt-4">
                  4.1. Criação de Conta
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Para usar certas funcionalidades da plataforma, você precisará criar uma conta. 
                  Você é responsável por:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Fornecer informações precisas e completas</li>
                  <li>Manter a segurança de sua senha</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                  <li>Manter suas informações atualizadas</li>
                </ul>

                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2 mt-4">
                  4.2. Tipos de Conta
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  A plataforma oferece diferentes tipos de conta:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li><strong>Cliente:</strong> Usuários que realizam compras nas revendas</li>
                  <li><strong>Revenda:</strong> Empresas que vendem produtos através da plataforma</li>
                  <li><strong>Administrador:</strong> Usuários com acesso administrativo completo</li>
                </ul>
              </section>

              {/* Uso Aceitável */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  5. Uso Aceitável
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. 
                  Você não deve:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Violar qualquer lei ou regulamento aplicável</li>
                  <li>Infringir direitos de propriedade intelectual</li>
                  <li>Transmitir vírus ou código malicioso</li>
                  <li>Tentar acessar áreas restritas da plataforma</li>
                  <li>Interferir no funcionamento da plataforma</li>
                  <li>Usar a plataforma para atividades fraudulentas</li>
                  <li>Coletar informações de outros usuários sem autorização</li>
                </ul>
              </section>

              {/* Pagamentos e Transações */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  6. Pagamentos e Transações
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Ao realizar transações através da plataforma:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Você é responsável por todas as transações realizadas em sua conta</li>
                  <li>Os preços são definidos pelas revendas e podem ser alterados a qualquer momento</li>
                  <li>As taxas de repasse são calculadas conforme a modalidade escolhida pela revenda</li>
                  <li>Reembolsos seguem as políticas específicas de cada revenda</li>
                  <li>Você concorda em pagar todos os valores devidos</li>
                </ul>
              </section>

              {/* Propriedade Intelectual */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  7. Propriedade Intelectual
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, imagens, 
                  downloads e software, é propriedade do Pixy Pay ou de seus fornecedores de conteúdo 
                  e está protegido por leis de direitos autorais e outras leis de propriedade intelectual.
                </p>
              </section>

              {/* Privacidade */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  8. Privacidade
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Sua privacidade é importante para nós. O uso de suas informações pessoais é regido 
                  por nossa Política de Privacidade, que faz parte integrante destes Termos. Ao usar 
                  a plataforma, você concorda com a coleta e uso de informações conforme descrito na 
                  Política de Privacidade.
                </p>
              </section>

              {/* Limitação de Responsabilidade */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  9. Limitação de Responsabilidade
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Na máxima extensão permitida por lei, o Pixy Pay não será responsável por:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-4 mt-3">
                  <li>Danos diretos, indiretos, incidentais ou consequenciais</li>
                  <li>Perda de lucros, dados ou oportunidades de negócio</li>
                  <li>Interrupções ou falhas no serviço</li>
                  <li>Disputas entre usuários</li>
                  <li>Qualidade de produtos ou serviços oferecidos por revendas</li>
                </ul>
              </section>

              {/* Modificações dos Termos */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  10. Modificações dos Termos
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Reservamos o direito de modificar estes Termos a qualquer momento. As alterações 
                  entrarão em vigor imediatamente após a publicação na plataforma. Seu uso continuado 
                  da plataforma após as alterações constitui sua aceitação dos novos Termos. 
                  Recomendamos que você revise periodicamente estes Termos.
                </p>
              </section>

              {/* Encerramento */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  11. Encerramento
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Podemos suspender ou encerrar sua conta e acesso à plataforma a qualquer momento, 
                  sem aviso prévio, por violação destes Termos ou por qualquer outro motivo que 
                  consideremos apropriado. Você também pode encerrar sua conta a qualquer momento 
                  através das configurações da sua conta.
                </p>
              </section>

              {/* Lei Aplicável */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  12. Lei Aplicável
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Estes Termos são regidos pelas leis do Brasil. Qualquer disputa relacionada a estes 
                  Termos será resolvida nos tribunais competentes do Brasil.
                </p>
              </section>

              {/* Contato */}
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  13. Contato
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através 
                  dos canais de suporte disponíveis na plataforma.
                </p>
              </section>

              {/* Aviso Final */}
              <div className="mt-8 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  <strong>Importante:</strong> Ao criar uma conta no Pixy Pay, você confirma que leu, 
                  entendeu e concorda com todos os termos e condições descritos acima. Se você não 
                  concordar com qualquer parte destes Termos, não deve usar nossa plataforma.
                </p>
              </div>
            </div>

            {/* Botão Voltar */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <Link to="/registro">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o Registro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}





















