type OpenCircleButtonProps = {
  onClick?: () => void
  title?: string
}

export function OpenCircleButton({ onClick, title }: OpenCircleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-gray-900 transition-colors hover:bg-gray-100"
    >
      <span className="block h-[6px] w-[6px] rotate-45 border-r-2 border-t-2 border-gray-900 -ml-[2px]" />
    </button>
  )
}