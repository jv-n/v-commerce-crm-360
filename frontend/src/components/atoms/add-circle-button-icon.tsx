type AddCircleButtonIconProps = {
  className?: string
}

export function AddCircleButtonIcon({
  className = "",
}: AddCircleButtonIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="11"
          cy="11"
          r="9.25"
          stroke="#06121C"
          strokeWidth="1.9"
        />
        <path
          d="M11 6.8V15.2"
          stroke="#06121C"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M6.8 11H15.2"
          stroke="#06121C"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}