import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchContactById } from "@/lib/api/contacts"
import { ContactResumoCard } from "@/components/molecules/ContactsTable/ContactResumoCard"
import { ClientStatusBadge } from "@/components/molecules/ContactsTable/ClientStatusBadge"
import type { Contact } from "@/types/contact"
import ArrowBackIosNewIcon  from "@mui/icons-material/ArrowBackIosNew"
import EmailOutlinedIcon    from "@mui/icons-material/EmailOutlined"
import PhoneOutlinedIcon    from "@mui/icons-material/PhoneOutlined"
import PersonOutlinedIcon   from "@mui/icons-material/PersonOutlined"

// ─── helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm text-gray-800">{value ?? "—"}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ContactDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [contact, setContact]   = useState<Contact | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [tab, setTab]           = useState<"informacoes" | "atividades">("informacoes")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    fetchContactById(id)
      .then(setContact)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (error || !contact) {
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
    <div className="p-6 h-full flex flex-col gap-5 bg-white min-h-full rounded-xl">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-700 transition-colors"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
          Contatos
        </button>
      </div>

      {/* ── Layout principal ───────────────────────────────────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ── Coluna esquerda: info do contato ─────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col gap-4">

          {/* Card de identidade */}
          <div className="border border-purple-100 rounded-xl p-4 flex flex-col items-center gap-2 bg-white shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <PersonOutlinedIcon sx={{ fontSize: 22, color: "#7C3AED" }} />
            </div>
            <p className="font-semibold text-gray-900 text-center text-sm leading-tight">
              {contact.name ?? "—"}
            </p>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-xs text-purple-600 hover:underline"
              >
                {contact.email}
              </a>
            )}
            <div className="flex gap-3 mt-1 text-gray-400">
              <EmailOutlinedIcon sx={{ fontSize: 18 }} />
              <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>

          {/* Informações importantes */}
          <div className="border border-purple-100 rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Informações importantes
            </p>
            <InfoRow label="ID Cliente" value={contact.id} />
            <InfoRow label="Email"      value={contact.email} />
            <InfoRow label="Telefone"   value={contact.phone} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Status</span>
              <ClientStatusBadge status={contact.clientStatus} />
            </div>
            <InfoRow label="Região"          value={contact.region} />
            <InfoRow label="Origem"          value={contact.origin} />
            <InfoRow label="Primeira compra" value={contact.firstPurchase} />
            <InfoRow label="Última compra"   value={contact.lastPurchase} />
            <InfoRow label="Total de compras" value={contact.purchases} />
            <InfoRow label="Receita total"
              value={contact.totalRevenue != null
                ? `R$ ${contact.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : undefined}
            />
          </div>
        </div>

        {/* ── Coluna central ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(["informacoes", "atividades"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-purple-600 text-purple-700 bg-purple-50 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "informacoes" ? "Informações" : "Atividades"}
              </button>
            ))}
          </div>

          {tab === "informacoes" && (
            <div className="flex flex-col gap-4">
              {/* Resumo */}
              <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm">
                <ContactResumoCard contactId={contact.id} />
              </div>

              {/* Placeholder: Métricas do Lead — a ser implementado */}
              <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center text-xs text-gray-400">
                Métricas do Lead — em desenvolvimento
              </div>
            </div>
          )}

          {tab === "atividades" && (
            <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center text-xs text-gray-400">
              Atividades — em desenvolvimento
            </div>
          )}
        </div>

        {/* ── Coluna direita ───────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          {/* Placeholder: Pedidos do contato */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center text-xs text-gray-400">
            Pedidos do contato — em desenvolvimento
          </div>

          {/* Placeholder: Tickets do contato */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center text-xs text-gray-400">
            Tickets do contato — em desenvolvimento
          </div>
        </div>

      </div>
    </div>
  )
}
