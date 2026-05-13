import { useState } from "react"
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined"
import CheckIcon from "@mui/icons-material/Check"

interface CopyIdButtonProps {
  id: string
}

export function CopyIdButton({ id }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copiar ID: ${id}`}
      className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center size-5 shrink-0 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
    >
      {copied
        ? <CheckIcon sx={{ fontSize: 13, color: "#16a34a" }} />
        : <ContentCopyOutlinedIcon sx={{ fontSize: 13 }} />
      }
    </button>
  )
}
