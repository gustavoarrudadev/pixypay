import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  listarNotificacoesPush,
  criarNotificacaoPush,
  atualizarNotificacaoPush,
  removerNotificacaoPush,
  listarBannersAlerta,
  criarBannerAlerta,
  atualizarBannerAlerta,
  removerBannerAlerta,
  type NotificacaoPush,
  type BannerAlerta,
} from '@/lib/comunicacao'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Dialog, DialogActions } from '@/components/ui/dialog'
// Função auxiliar para formatar data
const formatarData = (data: string) => {
  const d = new Date(data)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Comunicacao() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoPush[]>([])
  const [banners, setBanners] = useState<BannerAlerta[]>([])
  const [carregando, setCarregando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'notificacoes' | 'banners'>('notificacoes')

  // Estados para notificações
  const [sheetNotificacaoAberto, setSheetNotificacaoAberto] = useState(false)
  const [notificacaoEditando, setNotificacaoEditando] = useState<NotificacaoPush | null>(null)
  const [formNotificacao, setFormNotificacao] = useState({
    titulo: '',
    descricao: '',
    exibir_para_revendas: true,
    exibir_para_clientes: true,
    exibir_para_colaboradores: true,
    data_inicio: '',
    data_fim: '',
  })

  // Estados para banners
  const [sheetBannerAberto, setSheetBannerAberto] = useState(false)
  const [bannerEditando, setBannerEditando] = useState<BannerAlerta | null>(null)
  const [dialogRemoverAberto, setDialogRemoverAberto] = useState(false)
  const [itemRemovendo, setItemRemovendo] = useState<{ tipo: 'notificacao' | 'banner'; id: string } | null>(null)
  const [formBanner, setFormBanner] = useState({
    titulo: '',
    descricao: '',
    cor_bg: '#f59e0b',
    cor_texto: '#000000',
    exibir_para_revendas: true,
    exibir_para_clientes: true,
    exibir_para_colaboradores: true,
    data_inicio: '',
    data_fim: '',
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    const [notifResult, bannersResult] = await Promise.all([
      listarNotificacoesPush(),
      listarBannersAlerta(),
    ])
    if (notifResult.error) {
      toast.error('Erro ao carregar notificações')
    } else {
      setNotificacoes(notifResult.notificacoes)
    }
    if (bannersResult.error) {
      toast.error('Erro ao carregar banners')
    } else {
      setBanners(bannersResult.banners)
    }
    setCarregando(false)
  }

  const handleCriarNotificacao = () => {
    setNotificacaoEditando(null)
    setFormNotificacao({
      titulo: '',
      descricao: '',
      exibir_para_revendas: true,
      exibir_para_clientes: true,
      exibir_para_colaboradores: true,
      data_inicio: '',
      data_fim: '',
    })
    setSheetNotificacaoAberto(true)
  }

  const handleEditarNotificacao = (notif: NotificacaoPush) => {
    setNotificacaoEditando(notif)
    setFormNotificacao({
      titulo: notif.titulo,
      descricao: notif.descricao,
      exibir_para_revendas: notif.exibir_para_revendas,
      exibir_para_clientes: notif.exibir_para_clientes,
      exibir_para_colaboradores: notif.exibir_para_colaboradores,
      data_inicio: notif.data_inicio ? new Date(notif.data_inicio).toISOString().slice(0, 16) : '',
      data_fim: notif.data_fim ? new Date(notif.data_fim).toISOString().slice(0, 16) : '',
    })
    setSheetNotificacaoAberto(true)
  }

  const handleSalvarNotificacao = async () => {
    if (!formNotificacao.titulo.trim() || !formNotificacao.descricao.trim()) {
      toast.error('Preencha título e descrição')
      return
    }

    const dados = {
      titulo: formNotificacao.titulo.trim(),
      descricao: formNotificacao.descricao.trim(),
      exibir_para_revendas: formNotificacao.exibir_para_revendas,
      exibir_para_clientes: formNotificacao.exibir_para_clientes,
      exibir_para_colaboradores: formNotificacao.exibir_para_colaboradores,
      data_inicio: formNotificacao.data_inicio ? new Date(formNotificacao.data_inicio).toISOString() : null,
      data_fim: formNotificacao.data_fim ? new Date(formNotificacao.data_fim).toISOString() : null,
    }

    let resultado
    if (notificacaoEditando) {
      resultado = await atualizarNotificacaoPush(notificacaoEditando.id, dados)
    } else {
      resultado = await criarNotificacaoPush(dados)
    }

    if (resultado.success) {
      toast.success(notificacaoEditando ? 'Notificação atualizada!' : 'Notificação criada!')
      setSheetNotificacaoAberto(false)
      await carregarDados()
    } else {
      toast.error(resultado.error?.message || 'Erro ao salvar notificação')
    }
  }

  const handleAtivarDesativarNotificacao = async (notif: NotificacaoPush) => {
    const resultado = await atualizarNotificacaoPush(notif.id, { ativo: !notif.ativo })
    if (resultado.success) {
      toast.success(`Notificação ${!notif.ativo ? 'ativada' : 'desativada'}!`)
      await carregarDados()
    } else {
      toast.error('Erro ao atualizar notificação')
    }
  }

  const handleCriarBanner = () => {
    setBannerEditando(null)
    setFormBanner({
      titulo: '',
      descricao: '',
      cor_bg: '#f59e0b',
      cor_texto: '#000000',
      exibir_para_revendas: true,
      exibir_para_clientes: true,
      exibir_para_colaboradores: true,
      data_inicio: '',
      data_fim: '',
    })
    setSheetBannerAberto(true)
  }

  const handleEditarBanner = (banner: BannerAlerta) => {
    setBannerEditando(banner)
    setFormBanner({
      titulo: banner.titulo,
      descricao: banner.descricao,
      cor_bg: banner.cor_bg,
      cor_texto: banner.cor_texto,
      exibir_para_revendas: banner.exibir_para_revendas,
      exibir_para_clientes: banner.exibir_para_clientes,
      exibir_para_colaboradores: banner.exibir_para_colaboradores,
      data_inicio: banner.data_inicio ? new Date(banner.data_inicio).toISOString().slice(0, 16) : '',
      data_fim: banner.data_fim ? new Date(banner.data_fim).toISOString().slice(0, 16) : '',
    })
    setSheetBannerAberto(true)
  }

  const handleSalvarBanner = async () => {
    if (!formBanner.titulo.trim() || !formBanner.descricao.trim()) {
      toast.error('Preencha título e descrição')
      return
    }

    const dados = {
      titulo: formBanner.titulo.trim(),
      descricao: formBanner.descricao.trim(),
      cor_bg: formBanner.cor_bg,
      cor_texto: formBanner.cor_texto,
      exibir_para_revendas: formBanner.exibir_para_revendas,
      exibir_para_clientes: formBanner.exibir_para_clientes,
      exibir_para_colaboradores: formBanner.exibir_para_colaboradores,
      data_inicio: formBanner.data_inicio ? new Date(formBanner.data_inicio).toISOString() : null,
      data_fim: formBanner.data_fim ? new Date(formBanner.data_fim).toISOString() : null,
    }

    let resultado
    if (bannerEditando) {
      resultado = await atualizarBannerAlerta(bannerEditando.id, dados)
    } else {
      resultado = await criarBannerAlerta(dados)
    }

    if (resultado.success) {
      toast.success(bannerEditando ? 'Banner atualizado!' : 'Banner criado!')
      setSheetBannerAberto(false)
      await carregarDados()
    } else {
      toast.error(resultado.error?.message || 'Erro ao salvar banner')
    }
  }

  const handleAtivarDesativarBanner = async (banner: BannerAlerta) => {
    const resultado = await atualizarBannerAlerta(banner.id, { ativo: !banner.ativo })
    if (resultado.success) {
      toast.success(`Banner ${!banner.ativo ? 'ativado' : 'desativado'}!`)
      await carregarDados()
    } else {
      toast.error('Erro ao atualizar banner')
    }
  }

  const handleRemover = (tipo: 'notificacao' | 'banner', id: string) => {
    setItemRemovendo({ tipo, id })
    setDialogRemoverAberto(true)
  }

  const confirmarRemocao = async () => {
    if (!itemRemovendo) return

    let resultado
    if (itemRemovendo.tipo === 'notificacao') {
      resultado = await removerNotificacaoPush(itemRemovendo.id)
    } else {
      resultado = await removerBannerAlerta(itemRemovendo.id)
    }

    if (resultado.success) {
      toast.success(`${itemRemovendo.tipo === 'notificacao' ? 'Notificação' : 'Banner'} removido!`)
      setDialogRemoverAberto(false)
      setItemRemovendo(null)
      await carregarDados()
    } else {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Comunicação
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Gerencie notificações push e banners de alerta
          </p>
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as 'notificacoes' | 'banners')}>
        <TabsList>
          <TabsTrigger value="notificacoes">
            <Bell className="w-4 h-4 mr-2" />
            Notificações Push
          </TabsTrigger>
          <TabsTrigger value="banners">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Banners de Alerta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notificacoes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCriarNotificacao}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Notificação
            </Button>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : notificacoes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  Nenhuma notificação cadastrada
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notificacoes.map((notif) => (
                <Card key={notif.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{notif.titulo}</CardTitle>
                          <Badge variant={notif.ativo ? 'default' : 'secondary'}>
                            {notif.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <CardDescription>{notif.descricao}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarNotificacao(notif)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAtivarDesativarNotificacao(notif)}
                        >
                          {notif.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemover('notificacao', notif.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {notif.exibir_para_revendas && <Badge variant="outline">Revendas</Badge>}
                      {notif.exibir_para_clientes && <Badge variant="outline">Clientes</Badge>}
                      {notif.exibir_para_colaboradores && (
                        <Badge variant="outline">Colaboradores</Badge>
                      )}
                      {notif.data_inicio && (
                        <span>Início: {formatarData(notif.data_inicio)}</span>
                      )}
                      {notif.data_fim && (
                        <span>Fim: {formatarData(notif.data_fim)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCriarBanner}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Banner
            </Button>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : banners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">Nenhum banner cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <Card key={banner.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{banner.titulo}</CardTitle>
                          <Badge variant={banner.ativo ? 'default' : 'secondary'}>
                            {banner.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <CardDescription>{banner.descricao}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarBanner(banner)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAtivarDesativarBanner(banner)}
                        >
                          {banner.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemover('banner', banner.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-neutral-300 dark:border-neutral-700"
                            style={{ backgroundColor: banner.cor_bg }}
                          />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Cor de fundo: {banner.cor_bg}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-neutral-300 dark:border-neutral-700"
                            style={{ backgroundColor: banner.cor_texto }}
                          />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Cor do texto: {banner.cor_texto}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {banner.exibir_para_revendas && <Badge variant="outline">Revendas</Badge>}
                        {banner.exibir_para_clientes && <Badge variant="outline">Clientes</Badge>}
                        {banner.exibir_para_colaboradores && (
                          <Badge variant="outline">Colaboradores</Badge>
                        )}
                        {banner.data_inicio && (
                          <span>Início: {formatarData(banner.data_inicio)}</span>
                        )}
                        {banner.data_fim && (
                          <span>Fim: {formatarData(banner.data_fim)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet Notificação */}
      <Sheet open={sheetNotificacaoAberto} onOpenChange={setSheetNotificacaoAberto}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {notificacaoEditando ? 'Editar Notificação' : 'Nova Notificação Push'}
            </SheetTitle>
            <SheetDescription>
              Configure a notificação que aparecerá no canto inferior direito
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formNotificacao.titulo}
                onChange={(e) => setFormNotificacao({ ...formNotificacao, titulo: e.target.value })}
                placeholder="Título da notificação"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formNotificacao.descricao}
                onChange={(e) =>
                  setFormNotificacao({ ...formNotificacao, descricao: e.target.value })
                }
                placeholder="Descrição da notificação"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label className="mb-3 block">Exibir para:</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revendas"
                    checked={formNotificacao.exibir_para_revendas}
                    onCheckedChange={(checked) =>
                      setFormNotificacao({ ...formNotificacao, exibir_para_revendas: checked === true })
                    }
                  />
                  <Label htmlFor="revendas" className="cursor-pointer">
                    Revendas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clientes"
                    checked={formNotificacao.exibir_para_clientes}
                    onCheckedChange={(checked) =>
                      setFormNotificacao({ ...formNotificacao, exibir_para_clientes: checked === true })
                    }
                  />
                  <Label htmlFor="clientes" className="cursor-pointer">
                    Clientes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="colaboradores"
                    checked={formNotificacao.exibir_para_colaboradores}
                    onCheckedChange={(checked) =>
                      setFormNotificacao({
                        ...formNotificacao,
                        exibir_para_colaboradores: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="colaboradores" className="cursor-pointer">
                    Colaboradores
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início (opcional)</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formNotificacao.data_inicio}
                  onChange={(e) =>
                    setFormNotificacao({ ...formNotificacao, data_inicio: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formNotificacao.data_fim}
                  onChange={(e) =>
                    setFormNotificacao({ ...formNotificacao, data_fim: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetNotificacaoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNotificacao}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet Banner */}
      <Sheet open={sheetBannerAberto} onOpenChange={setSheetBannerAberto}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{bannerEditando ? 'Editar Banner' : 'Novo Banner de Alerta'}</SheetTitle>
            <SheetDescription>
              Configure o banner que aparecerá acima dos títulos das páginas
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="banner_titulo">Título *</Label>
              <Input
                id="banner_titulo"
                value={formBanner.titulo}
                onChange={(e) => setFormBanner({ ...formBanner, titulo: e.target.value })}
                placeholder="Título do banner"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="banner_descricao">Descrição *</Label>
              <Textarea
                id="banner_descricao"
                value={formBanner.descricao}
                onChange={(e) => setFormBanner({ ...formBanner, descricao: e.target.value })}
                placeholder="Descrição do banner"
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cor_bg">Cor de Fundo *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="cor_bg"
                    type="color"
                    value={formBanner.cor_bg}
                    onChange={(e) => setFormBanner({ ...formBanner, cor_bg: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={formBanner.cor_bg}
                    onChange={(e) => setFormBanner({ ...formBanner, cor_bg: e.target.value })}
                    placeholder="#f59e0b"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cor_texto">Cor do Texto *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="cor_texto"
                    type="color"
                    value={formBanner.cor_texto}
                    onChange={(e) => setFormBanner({ ...formBanner, cor_texto: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={formBanner.cor_texto}
                    onChange={(e) => setFormBanner({ ...formBanner, cor_texto: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Exibir para:</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="banner_revendas"
                    checked={formBanner.exibir_para_revendas}
                    onCheckedChange={(checked) =>
                      setFormBanner({ ...formBanner, exibir_para_revendas: checked === true })
                    }
                  />
                  <Label htmlFor="banner_revendas" className="cursor-pointer">
                    Revendas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="banner_clientes"
                    checked={formBanner.exibir_para_clientes}
                    onCheckedChange={(checked) =>
                      setFormBanner({ ...formBanner, exibir_para_clientes: checked === true })
                    }
                  />
                  <Label htmlFor="banner_clientes" className="cursor-pointer">
                    Clientes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="banner_colaboradores"
                    checked={formBanner.exibir_para_colaboradores}
                    onCheckedChange={(checked) =>
                      setFormBanner({
                        ...formBanner,
                        exibir_para_colaboradores: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="banner_colaboradores" className="cursor-pointer">
                    Colaboradores
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banner_data_inicio">Data de Início (opcional)</Label>
                <Input
                  id="banner_data_inicio"
                  type="datetime-local"
                  value={formBanner.data_inicio}
                  onChange={(e) =>
                    setFormBanner({ ...formBanner, data_inicio: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="banner_data_fim">Data de Fim (opcional)</Label>
                <Input
                  id="banner_data_fim"
                  type="datetime-local"
                  value={formBanner.data_fim}
                  onChange={(e) => setFormBanner({ ...formBanner, data_fim: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetBannerAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarBanner}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog Remover */}
      <Dialog
        aberto={dialogRemoverAberto}
        onOpenChange={setDialogRemoverAberto}
        titulo="Remover"
        descricao={`Tem certeza que deseja remover este ${itemRemovendo?.tipo === 'notificacao' ? 'notificação' : 'banner'}? Esta ação não pode ser desfeita.`}
      >
        <DialogActions>
          <Button variant="outline" onClick={() => setDialogRemoverAberto(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmarRemocao}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

