import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined"
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined"
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"

import { ClientStatusBadge } from "@/components/molecules/ContactsTable/ClientStatusBadge"
import type { ClientStatusType } from "@/types/contact"
import type {
  ContactDetails,
  ContactMetrics,
  ContactOrdersPage,
  ContactTicketsPage,
  ContactViewedProduct,
} from "@/types/contactDetails"
import {
  fetchContactDetails,
  fetchContactMetrics,
  fetchContactOrders,
  fetchContactTickets,
  fetchContactViewedProducts,
} from "@/lib/api/contactDetails"

type TabType = "informacoes" | "atividades"

function formatCurrency(value?: number | null) {
  return `R$ ${(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function initials(name?: string | null) {
  if (!name) return "?"

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
        {label}
      </span>

      <span className="text-sm text-gray-800 break-words">{value ?? "—"}</span>
    </div>
  )
}

function ContactInfoItem({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>

      <span className="text-sm text-gray-900 break-words">{value ?? "—"}</span>
    </div>
  )
}

function ContactIdentityCard({
  details,
  onBack,
}: {
  details: ContactDetails
  onBack: () => void
}) {
  return (
    <div className="border border-purple-100 rounded-xl bg-white shadow-sm shrink-0 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-purple-700 transition-colors"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
          <span>Contatos</span>
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
            {initials(details.name)}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {details.name ?? "Contato sem nome"}
            </p>

            {details.email && (
              <a
                href={`mailto:${details.email}`}
                className="text-xs text-purple-600 hover:underline break-all"
              >
                {details.email}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-5 text-gray-900">
          <EmailOutlinedIcon sx={{ fontSize: 18 }} />
          <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
          <PersonOutlinedIcon sx={{ fontSize: 18 }} />
        </div>
      </div>
    </div>
  )
}

function ContactInfoCard({
  details,
  metrics,
}: {
  details: ContactDetails
  metrics: ContactMetrics | null
}) {
  const npsLabel = metrics?.categoriaNpsRecente

  const npsConfig =
    npsLabel === "Promotor"
      ? {
          progress: 75,
          barClass: "bg-green-400",
          textClass: "text-green-700",
        }
      : npsLabel === "Neutro"
        ? {
            progress: 50,
            barClass: "bg-yellow-400",
            textClass: "text-yellow-700",
          }
        : npsLabel === "Detrator"
          ? {
              progress: 25,
              barClass: "bg-red-400",
              textClass: "text-red-700",
            }
          : null

  return (
    <div className="border border-purple-100 rounded-xl bg-white shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative flex items-center justify-center">
          <p className="text-sm font-bold text-gray-900">
            Informações importantes
          </p>

          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 hover:text-purple-700 transition-colors"
            aria-label="Editar informações do contato"
          >
            <EditOutlinedIcon sx={{ fontSize: 17 }} />
          </button>
        </div>

        <div className="h-px bg-gray-200 mt-2" />
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 pr-3">
        <div className="flex flex-col gap-3">
          <ContactInfoItem label="ID Cliente" value={details.id} />
          <ContactInfoItem label="Email" value={details.email} />
          <ContactInfoItem label="Número de telefone" value={details.phone} />

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 font-medium">
              Status
            </span>

            <div>
              <ClientStatusBadge
                status={details.clientStatus as ClientStatusType | null}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 font-medium">
              Responsável
            </span>

            {details.responsible ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium shrink-0">
                  {initials(details.responsible)}
                </div>

                <span className="text-sm text-gray-900">
                  {details.responsible}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-900">—</span>
            )}
          </div>

          <ContactInfoItem label="Gênero" value={details.gender} />
          <ContactInfoItem label="Data de nascimento" value={details.birthDate} />
          <ContactInfoItem label="Idade" value={details.age} />
          <ContactInfoItem label="Data de cadastro" value={details.createdAt} />
          <ContactInfoItem label="Cidade" value={details.city} />
          <ContactInfoItem label="Estado" value={details.state} />
          <ContactInfoItem label="Região" value={details.region} />
          <ContactInfoItem label="País" value={details.country} />
          <ContactInfoItem label="Origem" value={details.origin} />

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 font-medium">Nps</span>

            {npsConfig ? (
              <>
                <span className={`text-sm pl-8 font-medium ${npsConfig.textClass}`}>
                  {npsLabel}
                </span>

                <div className="h-1 rounded-full bg-gray-300 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${npsConfig.barClass}`}
                    style={{ width: `${npsConfig.progress}%` }}
                  />
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400">
                Sem dados de NPS para este contato.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactSummaryCard({
  details,
  metrics,
}: {
  details: ContactDetails
  metrics: ContactMetrics | null
}) {
  const isLead = details.contactType === "Lead"

  return (
    <section className="border border-purple-200 rounded-xl bg-white shadow-sm px-4 py-3">
      <div className="flex items-center justify-center gap-1 border-b border-gray-200 pb-2">
        <h2 className="text-sm font-bold text-gray-900">Resumo da</h2>

        <span className="text-sm px-2 py-0.5 rounded-full bg-green-200 text-purple-700 leading-none">
          V.IA
        </span>
      </div>

      <div className="mt-3 rounded-lg p-[3px] bg-gradient-to-br from-blue-300 via-purple-300 to-green-400">
        <div className="min-h-[138px] rounded-md bg-white px-4 py-3 flex flex-col">
          <div className="text-xs text-gray-800 leading-relaxed">
            <p className="mb-3">
              Um breve resumo criado pelo agente, visando facilitar o
              entendimento dos dados:
            </p>

            {isLead ? (
              <div className="space-y-1">
                <p>
                  <strong>Origem:</strong> {details.origin ?? "—"}
                </p>
                <p>
                  <strong>Produto mais visualizado:</strong>{" "}
                  {metrics?.produtoMaisVisualizado ?? "—"}
                </p>
                <p>
                  <strong>Categoria mais visualizada:</strong>{" "}
                  {metrics?.categoriaMaisVisualizada ?? "—"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p>
                  <strong>Data de nascimento:</strong>{" "}
                  {details.birthDate ?? "—"}
                </p>
                <p>
                  <strong>Avaliação:</strong>{" "}
                  {metrics?.categoriaNpsRecente ?? "—"}
                </p>
                <p>
                  <strong>NPS:</strong>{" "}
                  {metrics?.categoriaNpsRecente ?? "Sem dados"}{" "}
                  {metrics?.mediaNps != null ? `- ${metrics.mediaNps}` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 text-sm text-gray-900">
            <span className="text-purple-500 text-lg">✦</span>
            <span>Faça uma pergunta</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactMetricsCard({
  details,
  metrics,
}: {
  details: ContactDetails
  metrics: ContactMetrics | null
}) {
  const isLead = details.contactType === "Lead"

  return (
    <section className="border border-purple-200 rounded-xl bg-white shadow-sm px-4 py-2.5">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-base font-bold text-gray-900">
          Métricas do contato
        </h2>

        <div className="flex items-center gap-2 text-xs text-gray-700">
          <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
          <span>Data: Esse mês</span>
          <span className="text-gray-500">⌄</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[155px_1fr] gap-3">
        <div className="flex flex-col gap-3">
          {isLead ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[98px]">
                <p className="text-xs font-semibold text-purple-300 mb-2">
                  Origem do Lead
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {details.origin ?? "—"}
                </p>

                <div className="h-px bg-gray-200 my-2.5" />

                <p className="text-xs text-gray-700">
                  <span className="text-purple-500 mr-1">▪</span>
                  Março 2025
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[98px]">
                <p className="text-xs font-semibold text-purple-300 mb-2">
                  Produto mais visto
                </p>

                <p className="text-base font-bold text-red-700 truncate">
                  {metrics?.produtoMaisVisualizado ?? "—"}
                </p>

                <div className="h-px bg-gray-200 my-2.5" />

                <p className="text-xs text-gray-700 truncate">
                  ID Produto: —
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[98px]">
                <p className="text-xs font-semibold text-purple-300 mb-2">
                  Compras esse mês
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(metrics?.comprasMes)}
                </p>

                <div className="h-px bg-gray-200 my-2.5" />

                <p className="text-xs text-gray-700">
                  <span className="text-purple-500 mr-1">▪</span>
                  Março 2025
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[98px]">
                <p className="text-xs font-semibold text-purple-300 mb-2">
                  Média NPS
                </p>

                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-green-700">
                    {metrics?.mediaNps ?? "—"}
                  </p>

                  {metrics?.categoriaNpsRecente && (
                    <span className="text-[10px] px-2 py-1 rounded bg-green-100 text-green-700">
                      {metrics.categoriaNpsRecente}
                    </span>
                  )}
                </div>

                <div className="h-px bg-gray-200 my-2.5" />

                <p className="text-xs text-gray-700">
                  <span className="text-purple-500 mr-1">▪</span>
                  Março 2025
                </p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[215px]">
          <p className="text-xs font-semibold text-purple-300 mb-2">
            {isLead
              ? "Categorias de produtos mais visualizados"
              : "Categorias de produtos mais comprados"}
          </p>

          <p className="text-xs text-gray-700 mb-3">
            <span className="text-purple-500 mr-1">▪</span>
            Março 2025
          </p>

          <div className="h-[112px] flex items-end justify-around border-b border-gray-700 px-4">
            <div className="w-8 h-[76px] bg-red-200 rounded-t-sm" />
            <div className="w-8 h-[50px] bg-pink-200 rounded-t-sm" />
            <div className="w-8 h-[64px] bg-orange-300 rounded-t-sm" />
            <div className="w-8 h-[86px] bg-cyan-100 rounded-t-sm" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-gray-700">
            <span>
              <span className="inline-block w-3 h-3 bg-red-200 rounded-sm mr-1 align-middle" />
              Esportes
            </span>

            <span>
              <span className="inline-block w-3 h-3 bg-pink-200 rounded-sm mr-1 align-middle" />
              Eletrodomésticos
            </span>

            <span>
              <span className="inline-block w-3 h-3 bg-orange-300 rounded-sm mr-1 align-middle" />
              Utilidades
            </span>

            <span>
              <span className="inline-block w-3 h-3 bg-cyan-100 rounded-sm mr-1 align-middle" />
              Informática
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactOrdersCard({ orders }: { orders: ContactOrdersPage | null }) {
  const rows = orders?.data ?? []

  return (
    <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
        <p className="text-sm font-bold text-gray-900">Pedidos do contato</p>

        <span className="text-xs text-gray-400">
          {orders?.total ?? 0} registro(s)
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Nenhum pedido encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-auto pr-1">
          {rows.map((order) => (
            <div
              key={`${order.id_pedido}-${order.produtos_resumo}`}
              className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {order.id_pedido}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {order.data_pedido ?? "Data não informada"}
                  </p>
                </div>

                <span className="text-[11px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 shrink-0">
                  {order.status ?? "—"}
                </span>
              </div>

              <p className="text-xs text-gray-700 mt-3">
                {order.produtos_resumo}
              </p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {order.metodo_pagamento ?? "Pagamento não informado"}
                </span>

                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(order.valor_total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactTicketsCard({ tickets }: { tickets: ContactTicketsPage | null }) {
  const rows = tickets?.data ?? []

  return (
    <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
        <p className="text-sm font-bold text-gray-900">Tickets do contato</p>

        <span className="text-xs text-gray-400">
          {tickets?.total ?? 0} registro(s)
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Nenhum ticket encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[240px] overflow-auto pr-1">
          {rows.map((ticket) => (
            <div
              key={ticket.ticket_id}
              className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {ticket.ticket_id}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {ticket.data_abertura ?? "Data não informada"}
                  </p>
                </div>

                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                  {ticket.status_atendimento ?? "—"}
                </span>
              </div>

              <p className="text-xs text-gray-700 mt-3">
                {ticket.tipo_problema ?? "Tipo não informado"}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <InfoRow label="Agente" value={ticket.agente_suporte} />
                <InfoRow label="Nota" value={ticket.nota_avaliacao} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ViewedProductsCard({
  viewedProducts,
}: {
  viewedProducts: ContactViewedProduct[]
}) {
  return (
    <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
        <p className="text-sm font-bold text-gray-900">
          Últimos produtos visualizados
        </p>

        <VisibilityOutlinedIcon sx={{ fontSize: 17, color: "#7C3AED" }} />
      </div>

      {viewedProducts.length === 0 ? (
        <p className="text-xs text-gray-400">
          Nenhum produto visualizado encontrado.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {viewedProducts.map((product, index) => (
            <div
              key={`${product.id_produto ?? "produto"}-${index}`}
              className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm"
            >
              <p className="text-sm font-bold text-gray-900">
                {product.nome_produto ?? "Produto não informado"}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {product.categoria ?? "Categoria não informada"}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <InfoRow
                  label="Última visualização"
                  value={product.data_ultima_visualizacao}
                />
                <InfoRow label="Canal" value={product.canal} />
                <InfoRow label="Origem" value={product.origem} />
                <InfoRow label="Dispositivo" value={product.dispositivo} />
              </div>

              {product.observacao && (
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  {product.observacao}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivitiesPlaceholder() {
  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 text-center">
      <CalendarMonthOutlinedIcon sx={{ fontSize: 24, color: "#9CA3AF" }} />

      <p className="text-sm text-gray-500 mt-2">
        Atividades ainda não disponíveis.
      </p>

      <p className="text-xs text-gray-400 mt-1">
        Para preencher essa aba com histórico real, será necessária uma tabela de
        auditoria ou eventos.
      </p>
    </div>
  )
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [details, setDetails] = useState<ContactDetails | null>(null)
  const [metrics, setMetrics] = useState<ContactMetrics | null>(null)
  const [orders, setOrders] = useState<ContactOrdersPage | null>(null)
  const [tickets, setTickets] = useState<ContactTicketsPage | null>(null)
  const [viewedProducts, setViewedProducts] = useState<ContactViewedProduct[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<TabType>("informacoes")

  useEffect(() => {
    if (!id) return

    const contactId = id
    let active = true

    async function loadContact() {
      try {
        setLoading(true)
        setError(false)

        const contactDetails = await fetchContactDetails(contactId)

        if (!active) return

        setDetails(contactDetails)

        const [metricsResult, ordersResult, ticketsResult, viewedProductsResult] =
          await Promise.allSettled([
            fetchContactMetrics(contactId),
            fetchContactOrders(contactId, { page: 1, pageSize: 5 }),
            fetchContactTickets(contactId, { page: 1, pageSize: 5 }),
            fetchContactViewedProducts(contactId),
          ])

        if (!active) return

        setMetrics(metricsResult.status === "fulfilled" ? metricsResult.value : null)
        setOrders(ordersResult.status === "fulfilled" ? ordersResult.value : null)
        setTickets(ticketsResult.status === "fulfilled" ? ticketsResult.value : null)
        setViewedProducts(
          viewedProductsResult.status === "fulfilled"
            ? viewedProductsResult.value
            : []
        )
      } catch {
        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadContact()

    return () => {
      active = false
    }
  }, [id])

  const isLead = useMemo(() => details?.contactType === "Lead", [details])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Carregando contato...
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-500 text-sm">Contato não encontrado.</p>

        <button
          onClick={() => navigate("/contacts")}
          className="text-sm text-purple-600 hover:underline"
        >
          Voltar para contatos
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 h-full min-h-0 overflow-hidden bg-white rounded-xl">
      <div className="grid grid-cols-[340px_minmax(560px,620px)_320px] justify-center gap-5 h-full min-h-0 overflow-hidden">
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          <ContactIdentityCard
            details={details}
            onBack={() => navigate("/contacts")}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            <ContactInfoCard details={details} metrics={metrics} />
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0 min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 rounded-xl border border-purple-100 bg-white shadow-sm overflow-hidden shrink-0">
            {(["informacoes", "atividades"] as const).map((currentTab) => (
              <button
                key={currentTab}
                onClick={() => setTab(currentTab)}
                className={`h-12 text-sm font-semibold transition-colors ${
                  tab === currentTab
                    ? "bg-purple-100 text-gray-900 border-r border-purple-200"
                    : "bg-white text-gray-400 hover:text-gray-600"
                }`}
              >
                {currentTab === "informacoes" ? "Informações" : "Atividades"}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden pr-1">
            {tab === "informacoes" ? (
              <div className="flex flex-col gap-3">
                <ContactSummaryCard details={details} metrics={metrics} />
                <ContactMetricsCard details={details} metrics={metrics} />
              </div>
            ) : (
              <ActivitiesPlaceholder />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0 overflow-auto pr-1">
          {isLead ? (
            <>
              <ViewedProductsCard viewedProducts={viewedProducts} />

              <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                  Próxima ação sugerida
                </p>

                <p className="text-sm text-gray-700 leading-relaxed">
                  Priorizar abordagem com base no produto mais visualizado e no
                  histórico de carrinho/checkout.
                </p>
              </div>
            </>
          ) : (
            <>
              <ContactOrdersCard orders={orders} />
              <ContactTicketsCard tickets={tickets} />
            </>
          )}

          {!isLead && (
            <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">
                Ações rápidas
              </p>

              <div className="flex flex-col gap-2">
                {details.email && (
                  <a
                    href={`mailto:${details.email}`}
                    className="flex items-center gap-2 text-sm text-purple-700 hover:underline"
                  >
                    <EmailOutlinedIcon sx={{ fontSize: 16 }} />
                    Enviar email
                  </a>
                )}

                {details.phone && (
                  <a
                    href={`tel:${details.phone}`}
                    className="flex items-center gap-2 text-sm text-purple-700 hover:underline"
                  >
                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                    Ligar para contato
                  </a>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <ConfirmationNumberOutlinedIcon sx={{ fontSize: 16 }} />
                  Novo ticket em breve
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}