import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined"
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined"
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined"
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined"
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined"
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined"

import { ClientStatusBadge } from "@/components/molecules/ContactsTable/ClientStatusBadge"
import type { ClientStatusType } from "@/types/contact"
import type {
  ContactDashboard,
  ContactDetails,
  ContactMetrics,
  ContactOrder,
  ContactOrdersPage,
  ContactPeriod,
  ContactTicketsPage,
} from "@/types/contactDetails"
import {
  fetchContactDashboard,
  fetchContactDetails,
} from "@/lib/api/contactDetails"

type TabType = "informacoes" | "atividades"
type TicketProblem = "Produto" | "Entrega" | "Pagamento" | "Reembolso"

const periodOptions: Array<{ label: string; value: ContactPeriod }> = [
  { label: "Esse mês", value: "current_month" },
  { label: "Últimos 3 meses", value: "last_3_months" },
  { label: "Esse semestre", value: "current_semester" },
  { label: "Esse ano", value: "current_year" },
  { label: "Todo o período", value: "all_time" },
]

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

function ViaBadge() {
  return (
    <span
      className="px-3 py-1 rounded-full text-white text-sm font-semibold select-none leading-none"
      style={{
        background:
          "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #74FF60 100%)",
      }}
    >
      V.IA
    </span>
  )
}

function ViaIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <img
      src="/v_ai.svg"
      alt="Ícone V.IA"
      className={className}
      draggable={false}
    />
  )
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

function PeriodSelect({
  value,
  onChange,
  disabled,
}: {
  value: ContactPeriod
  onChange: (value: ContactPeriod) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />

      <span>Data:</span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ContactPeriod)}
        className="rounded-lg border border-purple-100 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition-colors hover:border-purple-300 focus:border-purple-500 disabled:opacity-60"
      >
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function getOrderStatusClass(status?: string | null) {
  const normalized = status?.toLowerCase() ?? ""

  if (
    normalized.includes("sucesso") ||
    normalized.includes("aprovado") ||
    normalized.includes("entregue") ||
    normalized.includes("concluido") ||
    normalized.includes("concluído") ||
    normalized.includes("finalizado")
  ) {
    return "bg-green-100 text-green-700"
  }

  if (
    normalized.includes("recusado") ||
    normalized.includes("cancelado") ||
    normalized.includes("falha") ||
    normalized.includes("erro")
  ) {
    return "bg-red-100 text-red-700"
  }

  if (
    normalized.includes("processando") ||
    normalized.includes("pendente") ||
    normalized.includes("em andamento")
  ) {
    return "bg-yellow-100 text-yellow-700"
  }

  if (normalized.includes("reembolsado")) {
    return "bg-blue-100 text-blue-700"
  }

  return "bg-purple-50 text-purple-700"
}

function getTicketStatusClass(status?: string | null) {
  const normalized = status?.toLowerCase() ?? ""

  if (
    normalized.includes("finalizado") ||
    normalized.includes("resolvido") ||
    normalized.includes("concluido") ||
    normalized.includes("concluído")
  ) {
    return "bg-green-100 text-green-700"
  }

  if (
    normalized.includes("aberto") ||
    normalized.includes("pendente") ||
    normalized.includes("andamento")
  ) {
    return "bg-yellow-100 text-yellow-700"
  }

  if (
    normalized.includes("cancelado") ||
    normalized.includes("recusado") ||
    normalized.includes("erro")
  ) {
    return "bg-red-100 text-red-700"
  }

  return "bg-gray-100 text-gray-600"
}

function normalizeTicketProblem(problem?: string | null): TicketProblem | null {
  const normalized = problem
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

  if (!normalized) return null

  if (normalized === "produto" || normalized.includes("produto")) {
    return "Produto"
  }

  if (normalized === "entrega" || normalized.includes("entrega")) {
    return "Entrega"
  }

  if (normalized === "pagamento" || normalized.includes("pagamento")) {
    return "Pagamento"
  }

  if (normalized === "reembolso" || normalized.includes("reembolso")) {
    return "Reembolso"
  }

  return null
}

function TicketProblemIcon({ problem }: { problem?: string | null }) {
  const iconStyle = {
    fontSize: 18,
    color: "#A855F7",
  }

  const normalizedProblem = normalizeTicketProblem(problem)

  if (normalizedProblem === "Produto") {
    return (
      <span className="inline-flex shrink-0">
        <ShoppingCartOutlinedIcon sx={iconStyle} />
      </span>
    )
  }

  if (normalizedProblem === "Entrega") {
    return (
      <span className="inline-flex shrink-0">
        <LocalShippingOutlinedIcon sx={iconStyle} />
      </span>
    )
  }

  if (normalizedProblem === "Pagamento") {
    return (
      <span className="inline-flex shrink-0">
        <PaymentsOutlinedIcon sx={iconStyle} />
      </span>
    )
  }

  if (normalizedProblem === "Reembolso") {
    return (
      <span className="inline-flex shrink-0">
        <ReplayOutlinedIcon sx={iconStyle} />
      </span>
    )
  }

  return null
}

function formatOrderDate(date?: string | null) {
  return date ?? "Data não informada"
}

function formatProductQuantity(quantity?: number | null) {
  const value = Number(quantity || 0)

  if (Number.isInteger(value)) {
    return value.toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
    })
  }

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })
}

function formatOrderProducts(order: ContactOrder) {
  if (order.produtos?.length) {
    return order.produtos.map((product) => ({
      quantity: product.quantidade,
      name: product.nome_produto ?? "Produto",
    }))
  }

  return [
    {
      quantity: order.quantidade_total,
      name: order.produtos_resumo || "Produto não informado",
    },
  ]
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
  return (
    <section className="border border-purple-200 rounded-xl bg-white shadow-sm px-4 py-3">
      <div className="flex items-center justify-center gap-1 border-b border-gray-200 pb-2">
        <h2 className="text-sm font-bold text-gray-900">Resumo da</h2>
        <ViaBadge />
      </div>

      <div className="mt-3 rounded-lg p-[3px] bg-gradient-to-br from-blue-300 via-purple-300 to-green-400">
        <div className="min-h-[138px] rounded-md bg-white px-4 py-3 flex flex-col">
          <div className="text-xs text-gray-800 leading-relaxed">
            <p className="mb-3">
              Um breve resumo criado pelo agente, visando facilitar o
              entendimento dos dados:
            </p>

            <div className="space-y-1">
              <p>
                <strong>Período analisado:</strong>{" "}
                {metrics?.periodLabel ?? "Todo o período"}
              </p>
              <p>
                <strong>Volume financeiro histórico:</strong>{" "}
                {formatCurrency(metrics?.comprasMes)}
              </p>
              <p>
                <strong>NPS:</strong>{" "}
                {metrics?.categoriaNpsRecente ?? "Sem dados"}{" "}
                {metrics?.mediaNps != null ? `- ${metrics.mediaNps}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 text-sm text-gray-900">
            <ViaIcon className="w-7 h-7" />
            <span>Faça uma pergunta</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactMetricsCard({
  metrics,
  selectedPeriod,
  onPeriodChange,
  loading,
}: {
  metrics: ContactMetrics | null
  selectedPeriod: ContactPeriod
  onPeriodChange: (value: ContactPeriod) => void
  loading: boolean
}) {
  const chartData =
    metrics?.categoriasMaisCompradas
      ?.filter((item) => Number(item.receita_total) > 0)
      .slice(0, 4) ?? []

  const hasChartData = chartData.length > 0

  const rawMaxValue = hasChartData
    ? Math.max(...chartData.map((item) => Number(item.receita_total) || 0), 1)
    : 1

  const getNiceStep = (value: number) => {
    const roughStep = value / 4
    const magnitude = 10 ** Math.floor(Math.log10(roughStep))
    const normalized = roughStep / magnitude

    const niceNormalized =
      normalized <= 1
        ? 1
        : normalized <= 2
          ? 2
          : normalized <= 5
            ? 5
            : 10

    return niceNormalized * magnitude
  }

  const step = getNiceStep(rawMaxValue)
  const maxValue = step * 4
  const axisValues = [4, 3, 2, 1, 0].map((multiplier) => multiplier * step)

  const barColors = [
    "bg-red-200",
    "bg-pink-200",
    "bg-orange-300",
    "bg-cyan-100",
  ]

  return (
    <section className="relative border border-purple-200 rounded-xl bg-white shadow-sm px-4 py-3">
      {loading && (
        <div className="absolute inset-0 z-10 rounded-xl bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <span className="text-xs text-purple-600 font-medium">
            Atualizando dashboard...
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-base font-bold text-gray-900">
          Métricas do contato
        </h2>

        <PeriodSelect
          value={selectedPeriod}
          onChange={onPeriodChange}
          disabled={loading}
        />
      </div>

      <div className="mt-3 grid grid-cols-[170px_1fr] gap-3">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm min-h-[108px] flex flex-col">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg leading-none text-gray-400 font-semibold shrink-0">
                $
              </span>

              <p className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                Compras no período
              </p>
            </div>

            <p className="mt-2 text-[22px] font-bold text-gray-950 leading-none">
              {formatCurrency(metrics?.comprasMes)}
            </p>

            <div className="h-px bg-gray-200 mt-3 mb-2" />

            <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
              <span className="text-purple-500 mr-2">▪</span>
              {metrics?.periodLabel ?? "Esse mês"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm min-h-[108px] flex flex-col">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-sm border border-gray-400 flex items-center justify-center text-gray-400 shrink-0">
                <BarChartOutlinedIcon sx={{ fontSize: 15 }} />
              </div>

              <p className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                Média NPS
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <p className="text-[22px] font-bold text-green-700 leading-none">
                {metrics?.mediaNps ?? "—"}
              </p>

              {metrics?.categoriaNpsRecente && (
                <span className="text-[10px] px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                  {metrics.categoriaNpsRecente}
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200 mt-3 mb-2" />

            <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
              <span className="text-purple-500 mr-2">▪</span>
              {metrics?.periodLabel ?? "Esse mês"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[216px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-sm border border-purple-200 flex items-center justify-center text-purple-300 text-xs">
              ▣
            </div>

            <p className="text-xs font-semibold text-purple-300">
              Valor comprado por categoria
            </p>
          </div>

          <p className="text-xs text-gray-700 mb-3">
            <span className="text-purple-500 mr-1">▪</span>
            {metrics?.periodLabel ?? "Esse mês"}
          </p>

          {hasChartData ? (
            <>
              <div className="relative h-[125px] pr-12">
                <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-800">
                  {axisValues.map((value, index) => (
                    <span key={`${value}-${index}`}>
                      {Number(value).toLocaleString("pt-BR", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  ))}
                </div>

                <div className="h-full flex items-end justify-around border-b border-gray-700">
                  {chartData.map((item, index) => {
                    const value = Number(item.receita_total) || 0
                    const height = Math.max((value / maxValue) * 95, 10)

                    return (
                      <div
                        key={`${item.categoria}-${index}`}
                        className="h-full flex items-end justify-center"
                        title={`${item.categoria}: ${formatCurrency(value)}`}
                      >
                        <div
                          className="relative flex justify-center"
                          style={{ height: `${height}px` }}
                        >
                          <span className="absolute -top-5 text-[10px] font-medium text-gray-700 whitespace-nowrap">
                            {formatCurrency(value)}
                          </span>

                          <div
                            className={`w-10 h-full rounded-t-sm ${
                              barColors[index % barColors.length]
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-gray-700">
                {chartData.map((item, index) => (
                  <span key={`${item.categoria}-legend-${index}`}>
                    <span
                      className={`inline-block w-3 h-3 rounded-sm mr-1 align-middle ${
                        barColors[index % barColors.length]
                      }`}
                    />
                    {item.categoria}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[125px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
              <p className="text-xs text-gray-400">
                Sem dados financeiros por categoria para este contato.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ContactOrdersCard({ orders }: { orders: ContactOrdersPage | null }) {
  const rows = orders?.data ?? []

  return (
    <div className="border border-purple-100 rounded-xl px-4 py-3 bg-white shadow-sm h-full min-h-0 flex flex-col">
      <div className="shrink-0 border-b border-gray-200 pb-2 mb-3">
        <h3 className="text-center text-sm font-bold text-gray-900">
          Pedidos do contato
        </h3>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-xs text-gray-400">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto pr-1">
          <div className="flex flex-col gap-3">
            {rows.map((order) => {
              const products = formatOrderProducts(order)

              return (
                <div
                  key={`${order.id_pedido}-${order.produtos_resumo}`}
                  className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <RequestQuoteOutlinedIcon
                      sx={{ fontSize: 20 }}
                      className="text-gray-500 shrink-0 mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-600 underline truncate">
                        {order.id_pedido}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 text-[11px] text-gray-800 leading-snug">
                    <p>
                      <span>Data de abertura: </span>
                      <span className="text-purple-600">
                        {formatOrderDate(order.data_pedido)}
                      </span>
                    </p>

                    <p className="leading-relaxed">
                      <span>Produtos: </span>

                      {products.map((product, index) => (
                        <span key={`${product.name}-${index}`}>
                          <span className="font-bold text-purple-600">
                            {formatProductQuantity(product.quantity)}x
                          </span>{" "}
                          <span>{product.name}</span>
                          {index < products.length - 1 && (
                            <span className="mx-1 text-gray-500">|</span>
                          )}
                        </span>
                      ))}
                    </p>

                    <div className="flex items-center gap-2">
                      <span>Status Pedido:</span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${getOrderStatusClass(
                          order.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {order.status ?? "—"}
                      </span>
                    </div>

                    <p>
                      <span>Valor: </span>
                      <span className="text-purple-600">
                        {formatCurrency(order.valor_total)}
                      </span>
                    </p>

                    <p>
                      <span>Método de pagamento: </span>
                      <span className="text-purple-600">
                        {order.metodo_pagamento ?? "—"}
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ContactTicketsCard({ tickets }: { tickets: ContactTicketsPage | null }) {
  const rows = tickets?.data ?? []

  return (
    <div className="border border-purple-100 rounded-xl px-4 py-3 bg-white shadow-sm h-full min-h-0 flex flex-col">
      <div className="shrink-0 border-b border-gray-200 pb-2 mb-3">
        <h3 className="text-center text-sm font-bold text-gray-900">
          Tickets do contato
        </h3>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-xs text-gray-400">Nenhum ticket encontrado.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto pr-1">
          <div className="flex flex-col gap-3">
            {rows.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <ConfirmationNumberOutlinedIcon
                    sx={{ fontSize: 20 }}
                    className="text-gray-500 shrink-0 mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-600 underline truncate">
                      {ticket.ticket_id}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 text-[11px] text-gray-800 leading-snug">
                  <p>
                    <span>Data de abertura: </span>
                    <span className="text-purple-600">
                      {ticket.data_abertura ?? "Data não informada"}
                    </span>
                    {ticket.hora_abertura && (
                      <span className="text-gray-500">
                        {" "}
                        - {ticket.hora_abertura}
                      </span>
                    )}
                  </p>

                  <p>
                    <span>ID Ticket: </span>
                    <span className="text-purple-600 break-all">
                      {ticket.ticket_id}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <span>Status Ticket:</span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${getTicketStatusClass(
                        ticket.status_atendimento
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {ticket.status_atendimento ?? "—"}
                    </span>
                  </div>

                  <p className="flex items-center gap-2">
                    <span>Problema:</span>

                    <TicketProblemIcon problem={ticket.tipo_problema} />

                    <span>{ticket.tipo_problema ?? "Não informado"}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
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

  const [summaryMetrics, setSummaryMetrics] = useState<ContactMetrics | null>(null)
  const [dashboardMetrics, setDashboardMetrics] =
    useState<ContactMetrics | null>(null)

  const [orders, setOrders] = useState<ContactOrdersPage | null>(null)
  const [tickets, setTickets] = useState<ContactTicketsPage | null>(null)

  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [error, setError] = useState(false)
  const [tab, setTab] = useState<TabType>("informacoes")
  const [selectedPeriod, setSelectedPeriod] =
    useState<ContactPeriod>("current_month")

  const [dashboardCache, setDashboardCache] = useState<
    Partial<Record<ContactPeriod, ContactDashboard>>
  >({})

  useEffect(() => {
    if (!id) return

    const contactId = id
    let active = true

    async function loadDetails() {
      try {
        setLoading(true)
        setError(false)

        const contactDetails = await fetchContactDetails(contactId)

        if (!active) return

        setDetails(contactDetails)
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

    loadDetails()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    const contactId = id
    let active = true

    async function loadAllTimeHistory() {
      try {
        setHistoryLoading(true)

        const dashboard = await fetchContactDashboard(contactId, {
          page: 1,
          pageSize: 5,
          period: "all_time",
        })

        if (!active) return

        setSummaryMetrics(dashboard.metrics)
        setOrders(dashboard.orders)
        setTickets(dashboard.tickets)
      } catch {
        if (active) {
          setSummaryMetrics(null)
          setOrders(null)
          setTickets(null)
        }
      } finally {
        if (active) {
          setHistoryLoading(false)
        }
      }
    }

    loadAllTimeHistory()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    const cachedDashboard = dashboardCache[selectedPeriod]

    if (cachedDashboard) {
      setDashboardMetrics(cachedDashboard.metrics)
      return
    }

    const contactId = id
    let active = true

    async function loadDashboardMetrics() {
      try {
        setDashboardLoading(true)

        const dashboard = await fetchContactDashboard(contactId, {
          page: 1,
          pageSize: 5,
          period: selectedPeriod,
        })

        if (!active) return

        setDashboardMetrics(dashboard.metrics)

        setDashboardCache((currentCache) => ({
          ...currentCache,
          [selectedPeriod]: dashboard,
        }))
      } catch {
        if (active) {
          setDashboardMetrics(null)
        }
      } finally {
        if (active) {
          setDashboardLoading(false)
        }
      }
    }

    loadDashboardMetrics()

    return () => {
      active = false
    }
  }, [id, selectedPeriod, dashboardCache])

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
            <ContactInfoCard details={details} metrics={summaryMetrics} />
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
                <ContactSummaryCard details={details} metrics={summaryMetrics} />

                <ContactMetricsCard
                  metrics={dashboardMetrics}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                  loading={dashboardLoading}
                />
              </div>
            ) : (
              <ActivitiesPlaceholder />
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex flex-col gap-4 overflow-hidden">
          {historyLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-start justify-center pt-6">
              <span className="text-xs text-purple-600 font-medium">
                Carregando histórico...
              </span>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <ContactOrdersCard orders={orders} />
          </div>

          <div className="flex-1 min-h-0">
            <ContactTicketsCard tickets={tickets} />
          </div>
        </div>
      </div>
    </div>
  )
}