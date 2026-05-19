import { useState, useEffect } from "react"
import CloseIcon from "@mui/icons-material/Close"

export interface ExportPill {
  label: string
  value: string
}

interface Props {
  open: boolean
  onClose: () => void
  total: number
  entityLabel: string
  pills: ExportPill[]
  exportLoading: boolean
  onExport: () => void
  selectedCount?: number
  onExportSelected?: () => void
}

export function ExportPopover({
  open, onClose, total, entityLabel, pills, exportLoading, onExport,
  selectedCount = 0, onExportSelected,
}: Props) {
  const [mode, setMode] = useState<"all" | "selected">("all")
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) { setMode("all"); setConfirmOpen(false) }
  }, [open])

  if (!open) return null

  const hasSelection = selectedCount > 0
  const isSelected  = mode === "selected" && hasSelection

  const handleExport = () => {
    if (isSelected) {
      onExportSelected?.()
    } else if (pills.length === 0) {
      setConfirmOpen(true)
    } else {
      onExport()
    }
  }

  if (confirmOpen) {
    const entityLower = entityLabel.toLowerCase()
    return (
      <div
        className="fixed inset-0 bg-black/20 flex items-center justify-center z-60"
        onMouseDown={() => setConfirmOpen(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[480px] p-8 flex flex-col gap-5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-gray-900">Você tem certeza?</h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            Você está exportando toda a planilha{" "}
            <span className="text-purple-600 font-semibold">{entityLower}</span>{" "}
            sem{" "}
            <span className="text-purple-600 font-semibold">nenhum filtro</span>,
            sendo assim, todos os {entityLower} dessa planilha serão exportados,
            isso significa:{" "}
            <span className="text-purple-600 font-bold">{total.toLocaleString("pt-BR")}</span>{" "}
            {entityLower}, caso não seja isso que deseja, aplique filtros ou
            selecione {entityLower} específicos, mas se esse for seu objetivo clique em{" "}
            <button
              onClick={() => { setConfirmOpen(false); onExport() }}
              className="text-purple-600 font-medium hover:underline"
            >
              continuar
            </button>
            .
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-green-400 text-green-600 font-medium text-sm hover:bg-green-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setConfirmOpen(false); onExport() }}
              disabled={exportLoading}
              className="px-5 py-2.5 rounded-xl bg-green-400 text-gray-900 font-bold text-sm hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? "Exportando..." : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-60"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center px-6 py-4 gap-4">
          <label
            className={[
              "flex items-center gap-2 select-none",
              hasSelection ? "cursor-pointer" : "opacity-40 cursor-not-allowed",
            ].join(" ")}
            onClick={() => hasSelection && setMode("selected")}
          >
            <span className={[
              "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              isSelected ? "border-gray-800" : "border-gray-300",
            ].join(" ")}>
              {isSelected && <span className="w-2 h-2 rounded-full bg-gray-800" />}
            </span>
            <span className={["text-sm whitespace-nowrap", isSelected ? "font-bold text-gray-900" : "text-gray-500"].join(" ")}>
              Exportar selecionados
            </span>
          </label>

          <div className="flex-1" />

          <label
            className="flex items-center gap-2 select-none cursor-pointer"
            onClick={() => setMode("all")}
          >
            <span className={[
              "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              !isSelected ? "border-gray-800" : "border-gray-300",
            ].join(" ")}>
              {!isSelected && <span className="w-2 h-2 rounded-full bg-gray-800" />}
            </span>
            <span className={["text-sm whitespace-nowrap", !isSelected ? "font-bold text-gray-900" : "text-gray-500"].join(" ")}>
              Exportar planilha
            </span>
          </label>

          <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 transition">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <hr className="border-gray-200" />

        {/* ── Corpo ── */}
        <div className="px-6 py-5 flex flex-col items-center gap-4">
          <span className="px-5 py-1.5 rounded-full border border-[#D1B1E5] bg-[#F7EBFF] text-sm font-semibold text-gray-900">
            {isSelected
              ? `x${selectedCount.toLocaleString("pt-BR")} selecionados`
              : `x${total.toLocaleString("pt-BR")} ${entityLabel}`}
          </span>

          {!isSelected && pills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 w-full">
              {pills.map((p, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D1B1E5] bg-white text-xs">
                  <span className="text-gray-600">{p.label}:</span>
                  <span className="font-semibold text-purple-700">{p.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* ── Footer ── */}
        <div className="px-6 py-4">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="w-full py-3 rounded-xl bg-[#F0DDFD] hover:bg-[#e5c9fb] text-gray-900 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? "Exportando..." : "Exportar em CSV"}
          </button>
        </div>
      </div>
    </div>
  )
}
