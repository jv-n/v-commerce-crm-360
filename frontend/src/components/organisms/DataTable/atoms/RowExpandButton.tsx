import { CiCircleChevRight, CiCircleChevDown } from "react-icons/ci"

interface RowExpandButtonProps {
  expanded: boolean
  /** Apenas para o botão de expandir-tudo no header. Linhas não precisam de onClick — a linha inteira é clicável. */
  onClick?: (e: React.MouseEvent) => void
}

export function RowExpandButton({ expanded, onClick }: RowExpandButtonProps) {
  const icon = expanded
    ? <CiCircleChevDown size={18} color="#7C3AED" />
    : <CiCircleChevRight size={18} color="#06121C" />

  if (onClick) {
    return (
      <button onClick={onClick} className="flex items-center justify-center">
        {icon}
      </button>
    )
  }

  return <span className="flex items-center justify-center">{icon}</span>
}
