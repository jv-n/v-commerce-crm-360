import { type ChangeEvent, useEffect, useState } from "react"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"

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
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined"
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined"

import { fetchContactActivities } from "@/lib/api/contacts"
import type { ContactActivity } from "@/lib/api/contacts"
import { CustomScrollArea } from "@/components/atoms/CustomScrollArea"
import { ClientStatusBadge } from "@/components/molecules/ContactsTable/ClientStatusBadge"
import { ContactEditModal } from "./ContactEditModal"

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
  deleteContactDetails,
  fetchContactDashboard,
  fetchContactDetails,
  patchContactDetails,
} from "@/lib/api/contactDetails"

type TabType = "informacoes" | "atividades"
type TicketProblem = "Produto" | "Entrega" | "Pagamento" | "Reembolso"

type AppFrameOutletContext = {
  onOpenAI: (message?: string) => void
}

type EditContactFormData = {
  name: string
  email: string
  phone: string
  status: string
  birthDate: string
  age: string
  gender: string
  createdAt: string
  origin: string
  country: string
  state: string
  region: string
  city: string
}

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

function DeleteConfirmationModal({
  contactName,
  deleting,
  onCancel,
  onConfirm,
}: {
  contactName?: string | null
  deleting: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-red-100 bg-white p-5 shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 24 }} />
          </div>
        </div>

        <h3 className="mt-3 text-center text-lg font-bold text-gray-900">
          Remover cliente?
        </h3>

        <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
          Esta ação vai remover{" "}
          <span className="font-semibold text-gray-900">
            {contactName || "este cliente"}
          </span>{" "}
          da base. Depois de confirmar, você voltará para a lista de contatos.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-9 min-w-[130px] rounded-lg text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-9 min-w-[150px] rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Removendo..." : "Sim, remover"}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditContactModal({
  details,
  onClose,
  onConfirm,
  onDelete,
}: {
  details: ContactDetails
  onClose: () => void
  onConfirm: (details: ContactDetails) => Promise<void> | void
  onDelete: () => Promise<void> | void
}) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const [formData, setFormData] = useState<EditContactFormData>({
    name: details.name ?? "",
    email: details.email ?? "",
    phone: details.phone ?? "",
    status: details.clientStatus ?? "",
    birthDate: details.birthDate ?? "",
    age: details.age != null ? String(details.age) : "",
    gender: details.gender ?? "",
    createdAt: details.createdAt ?? "",
    origin: details.origin ?? "",
    country: details.country ?? "",
    state: details.state ?? "",
    region: details.region ?? "",
    city: details.city ?? "",
  })

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  async function handleConfirm() {
    const updatedDetails = {
      ...details,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      clientStatus: formData.status,
      birthDate: formData.birthDate,
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender,
      createdAt: formData.createdAt,
      origin: formData.origin,
      country: formData.country,
      state: formData.state,
      region: formData.region,
      city: formData.city,
    } as ContactDetails

    try {
      setSaving(true)
      await onConfirm(updatedDetails)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleting(true)
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const labelClass = "mb-1 block text-xs font-bold text-gray-900"

  const fieldClass =
    "h-8 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-900 outline-none focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-60"

  const isBusy = saving || deleting

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
        <div className="relative w-full max-w-[560px] rounded-xl bg-white px-5 py-4 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="absolute right-4 top-4 text-gray-900 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal de edição"
          >
            <CloseOutlinedIcon sx={{ fontSize: 24 }} />
          </button>

          <h2 className="text-xl font-bold text-gray-900">
            Edição de Contato
          </h2>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className={labelClass}>Nome do contato</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <input
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Número de telefone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-[1fr_90px] gap-4">
                <div>
                  <label className={labelClass}>Data de nascimento</label>
                  <input
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Idade</label>
                  <input
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Gênero</label>
                <input
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Data de cadastro</label>
                <input
                  name="createdAt"
                  value={formData.createdAt}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Origem</label>
                <input
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>

              <div className="col-span-2 grid grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>País</label>
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Estado</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Região</label>
                  <input
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Cidade</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isBusy}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-5">
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="h-9 min-w-[150px] rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isBusy}
                className="h-9 min-w-[180px] rounded-lg border border-purple-300 bg-purple-100 text-sm font-medium text-gray-900 hover:bg-purple-200 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={isBusy}
                className="flex h-7 items-center gap-2 rounded-md bg-red-500 px-4 text-[11px] font-medium text-white hover:bg-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                Remover Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          contactName={details.name}
          deleting={deleting}
          onCancel={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}

function ContactInfoCard({
  details,
  metrics,
  onDetailsChange,
  onDeleteContact,
}: {
  details: ContactDetails
  metrics: ContactMetrics | null
  onDetailsChange: (details: ContactDetails) => void
  onDeleteContact: () => Promise<void> | void
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
    <>
      <div className="border border-purple-100 rounded-xl bg-white shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="relative flex items-center justify-center">
            <p className="text-sm font-bold text-gray-900">
              Informações importantes
            </p>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
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

            <ContactInfoItem label="Gênero" value={details.gender} />
            <ContactInfoItem
              label="Data de nascimento"
              value={details.birthDate}
            />
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
                  <span
                    className={`text-sm pl-8 font-medium ${npsConfig.textClass}`}
                  >
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

      {isEditModalOpen && (
        <EditContactModal
          details={details}
          onClose={() => setIsEditModalOpen(false)}
          onConfirm={async (updatedDetails) => {
            const savedDetails = await patchContactDetails(details.id, {
              name: updatedDetails.name,
              email: updatedDetails.email,
              phone: updatedDetails.phone,
              gender: updatedDetails.gender,
              birthDate: updatedDetails.birthDate,
              age: updatedDetails.age,
              createdAt: updatedDetails.createdAt,
              city: updatedDetails.city,
              state: updatedDetails.state,
              region: updatedDetails.region,
              country: updatedDetails.country,
              origin: updatedDetails.origin,
              clientStatus: updatedDetails.clientStatus,
            })

            onDetailsChange(savedDetails)
            setIsEditModalOpen(false)
          }}
          onDelete={async () => {
            await onDeleteContact()
            setIsEditModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function ContactSummaryCard({
  metrics,
  onAskViaClick,
}: {
  details: ContactDetails
  metrics: ContactMetrics | null
  onAskViaClick: () => void
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

          <button
            type="button"
            onClick={onAskViaClick}
            className="mt-auto ml-auto flex items-center justify-end gap-2 bg-transparent border-0 p-0 text-sm text-gray-900 cursor-pointer hover:text-purple-700 transition-colors"
            aria-label="Abrir assistente V.IA"
          >
            <ViaIcon className="w-7 h-7" />
            <span>Faça uma pergunta</span>
          </button>
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
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-5 w-5 items-center justify-center text-[#9B8DA6]">
              <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />
            </div>

            <p className="text-sm font-bold text-[#9B8DA6]">
              Categorias de produtos mais comprados
            </p>
          </div>

          <p className="text-sm font-semibold text-gray-900 mb-3">
            <span className="text-purple-500 mr-2">▪</span>
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
    <div className="h-full min-h-0 rounded-xl border border-dashed border-purple-100 bg-white/60 flex items-center justify-center px-4 text-center">
      <div>
        <CalendarMonthOutlinedIcon sx={{ fontSize: 24, color: "#9CA3AF" }} />

        <p className="text-sm text-gray-500 mt-2">
          Espaço reservado para futuras informações da aba de atividades.
        </p>

        <p className="text-xs text-gray-400 mt-1">
          Esta área poderá receber histórico, timeline, tarefas ou próximos
          passos do contato.
        </p>
      </div>
    </div>
  )
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { onOpenAI } = useOutletContext<AppFrameOutletContext>()

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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activities, setActivities] = useState<ContactActivity[]>([])

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
        fetchContactActivities(contactId).then(setActivities).catch(() => {})

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
    <>
      <div className="p-6 h-full min-h-0 overflow-hidden bg-white rounded-xl">
        <div className="grid grid-cols-[340px_minmax(560px,620px)_320px] justify-center gap-5 h-full min-h-0 overflow-hidden">
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          <ContactIdentityCard
            details={details}
            onBack={() => navigate("/contacts")}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            <ContactInfoCard
              details={details}
              metrics={summaryMetrics}
              onDetailsChange={setDetails}
              onDeleteContact={async () => {
                await deleteContactDetails(details.id)
                navigate("/contacts")
              }}
            />
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
                <ContactSummaryCard
                  details={details}
                  metrics={summaryMetrics}
                  onAskViaClick={() => onOpenAI()}
                />

                <ContactMetricsCard
                  metrics={dashboardMetrics}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                  loading={dashboardLoading}
                />
              </div>
            ) : (
              <div className="relative flex flex-col gap-4 h-full min-h-0">
                {historyLoading && (
                  <div className="absolute inset-0 z-10 rounded-xl bg-white/50 backdrop-blur-[1px] flex items-start justify-center pt-6">
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
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex flex-col gap-4 overflow-hidden">
          {historyLoading && tab === "informacoes" && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-start justify-center pt-6">
              <span className="text-xs text-purple-600 font-medium">
                Carregando histórico...
              </span>
            </div>
          )}

          {tab === "informacoes" ? (
            <>
              <div className="flex-1 min-h-0">
                <ContactOrdersCard orders={orders} />
              </div>

              <div className="flex-1 min-h-0">
                <ContactTicketsCard tickets={tickets} />
              </div>
            </>
          ) : (
            <div className="h-full rounded-xl border border-[#E5E5E5] shadow-[0_0_4px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden bg-white">
              <div className="flex items-center justify-center gap-2 px-5 py-4 shrink-0">
                <span className="text-base font-bold text-gray-900">Atividades</span>
              </div>
              <hr className="border-[#E5E5E5] shrink-0 mx-5" />
              <CustomScrollArea className="flex-1"><div className="p-3 flex flex-col gap-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Sem atividades registradas.</p>
                ) : activities.map(act => {
                  const dtPart = act.changed_at.includes("T") ? act.changed_at.split("T") : act.changed_at.split(" ")
                  const [y, m, d] = dtPart[0].split("-")
                  const actDate = `${d}/${m}/${y}`
                  const actTime = (dtPart[1] ?? "").slice(0, 5)
                  return (
                    <div key={act.id} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1.5 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                          {initials(act.user_name)}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{act.user_name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {"• "}Data da Alteração:{" "}
                        <span className="text-purple-600 font-medium">{actDate}</span>
                        {actTime && <> - {actTime}</>}
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Campo alterado:{" "}
                        <span className="text-purple-600 font-medium">{act.field_name}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Alteração: {act.old_value ?? "—"} para{" "}
                        <span className="font-semibold text-gray-900">{act.new_value ?? "—"}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Método: <span className="font-medium text-gray-800">{act.change_method}</span>
                      </span>
                    </div>
                  )
                })}
              </div></CustomScrollArea>
            </div>
          )}
        </div>
      </div>
      </div>
      {isEditOpen && (
        <ContactEditModal
          open={isEditOpen}
          details={details}
          onClose={() => setIsEditOpen(false)}
          onSuccess={(updated) => {
            setDetails(updated)
            setIsEditOpen(false)
            if (id) {
              fetchContactActivities(id).then(setActivities).catch(() => {})
            }
          }}
        />
      )}
    </>
  )
}