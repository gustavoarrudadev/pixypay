import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import Registro from './pages/Registro'
import EsqueciSenha from './pages/EsqueciSenha'
import ConfirmarEmail from './pages/ConfirmarEmail'
import RedefinirSenha from './pages/RedefinirSenha'
import MagicLinkLogin from './pages/MagicLinkLogin'
import GerenciarConta from './pages/cliente/GerenciarConta'
import GerenciarContaRevenda from './pages/revenda/GerenciarConta'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import Revendas from './pages/admin/Revendas'
import Clientes from './pages/admin/Clientes'
import PedidosAdmin from './pages/admin/Pedidos'
import ParcelamentosAdmin from './pages/admin/Parcelamentos'
import AgendamentosAdmin from './pages/admin/Agendamentos'
import InadimplenciaAdmin from './pages/admin/Inadimplencia'
import FinanceiroAdmin from './pages/admin/Financeiro'
import RepassesAdmin from './pages/admin/Repasses'
import GerenciarContaAdmin from './pages/admin/GerenciarContaAdmin'
import NovoCliente from './pages/admin/NovoCliente'
import ClienteLayout from './layouts/ClienteLayout'
import RevendaLayout from './layouts/RevendaLayout'
import MinhasCompras from './pages/cliente/MinhasCompras'
import DetalhesPedidoCliente from './pages/cliente/DetalhesPedido'
import Parcelamentos from './pages/cliente/Parcelamentos'
import ParcelamentosRevenda from './pages/revenda/Parcelamentos'
import MeusFavoritos from './pages/cliente/MeusFavoritos'
import Negociacoes from './pages/cliente/Negociacoes'
import Ajuda from './pages/cliente/Ajuda'
import Carrinho from './pages/cliente/Carrinho'
import Checkout from './pages/cliente/Checkout'
import PedidoConfirmado from './pages/cliente/PedidoConfirmado'
import ErroPedido from './pages/cliente/ErroPedido'
import Produtos from './pages/revenda/Produtos'
import DashboardRevenda from './pages/revenda/Dashboard'
import PresencaLoja from './pages/revenda/PresencaLoja'
import PedidosRevenda from './pages/revenda/Pedidos'
import DetalhesPedidoRevenda from './pages/revenda/DetalhesPedido'
import Agendamentos from './pages/revenda/Agendamentos'
import ClientesRevenda from './pages/revenda/Clientes'
import Financeiro from './pages/revenda/Financeiro'
import Relatorios from './pages/revenda/Relatorios'
import ColaboradoresRevenda from './pages/revenda/Colaboradores'
import AdministracaoRevenda from './pages/revenda/Administracao'
import RelatoriosAdmin from './pages/admin/Relatorios'
import ColaboradoresAdmin from './pages/admin/Colaboradores'
import AdministracaoAdmin from './pages/admin/Administracao'
import ComunicacaoAdmin from './pages/admin/Comunicacao'
import AjudaRevenda from './pages/revenda/Ajuda'
import LojaPublica from './pages/publica/LojaPublica'
import ProdutoPublico from './pages/publica/ProdutoPublico'
import VisualizarRevendaPage from './pages/admin/VisualizarRevenda'
import VisualizarClientePage from './pages/admin/VisualizarCliente'
import Notificacoes from './pages/Notificacoes'
import TermosDeUso from './pages/TermosDeUso'

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/magic-link-login" element={<MagicLinkLogin />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido-confirmado/:pedidoId" element={<PedidoConfirmado />} />
          <Route path="/cliente/erro-pedido" element={<ErroPedido />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />

          {/* Rotas Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="revendas" element={<Revendas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/novo" element={<NovoCliente />} />
            <Route path="pedidos" element={<PedidosAdmin />} />
            <Route path="pedidos/:id" element={<DetalhesPedidoRevenda />} />
            <Route path="parcelamentos" element={<ParcelamentosAdmin />} />
            <Route path="agendamentos" element={<AgendamentosAdmin />} />
            <Route path="repasses" element={<RepassesAdmin />} />
            <Route path="financeiro" element={<FinanceiroAdmin />} />
            <Route path="inadimplencia" element={<InadimplenciaAdmin />} />
            <Route path="relatorios" element={<RelatoriosAdmin />} />
            <Route path="colaboradores" element={<ColaboradoresAdmin />} />
            <Route path="administracao" element={<AdministracaoAdmin />} />
            <Route path="comunicacao" element={<ComunicacaoAdmin />} />
            <Route path="conta" element={<GerenciarContaAdmin />} />
          </Route>

          {/* Rotas Cliente */}
          <Route path="/cliente" element={<ClienteLayout />}>
            <Route index element={<Parcelamentos />} />
            <Route path="parcelamentos" element={<Parcelamentos />} />
            <Route path="compras" element={<MinhasCompras />} />
            <Route path="compras/:id" element={<DetalhesPedidoCliente />} />
            <Route path="parcelamentos" element={<Parcelamentos />} />
            <Route path="favoritos" element={<MeusFavoritos />} />
            <Route path="negociacoes" element={<Negociacoes />} />
            <Route path="ajuda" element={<Ajuda />} />
            <Route path="conta" element={<GerenciarConta />} />
            <Route path="notificacoes" element={<Notificacoes />} />
          </Route>

          {/* Rotas Revenda */}
          <Route path="/revenda" element={<RevendaLayout />}>
            <Route index element={<DashboardRevenda />} />
            <Route path="dashboard" element={<DashboardRevenda />} />
            <Route path="presenca" element={<PresencaLoja />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="pedidos" element={<PedidosRevenda />} />
            <Route path="pedidos/:id" element={<DetalhesPedidoRevenda />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="clientes" element={<ClientesRevenda />} />
            <Route path="parcelamentos" element={<ParcelamentosRevenda />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="relatorio" element={<Relatorios />} />
            <Route path="colaboradores" element={<ColaboradoresRevenda />} />
            <Route path="ajuda" element={<AjudaRevenda />} />
            <Route path="administracao" element={<AdministracaoRevenda />} />
            <Route path="conta" element={<GerenciarContaRevenda />} />
            <Route path="notificacoes" element={<Notificacoes />} />
          </Route>

          {/* Rota Pública - Loja */}
          <Route path="/loja/:linkPublico" element={<LojaPublica />} />
          <Route path="/loja/:linkPublico/produto/:linkProduto" element={<ProdutoPublico />} />

          {/* Rota Admin - Visualizar como Revenda */}
          <Route path="/visualizar-revenda" element={<VisualizarRevendaPage />} />

          {/* Rota Admin - Visualizar como Cliente */}
          <Route path="/visualizar-cliente" element={<VisualizarClientePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

