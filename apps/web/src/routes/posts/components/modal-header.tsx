type ModalHeaderProps = {
  authorName: string
  onClose?: () => void
}

export function ModalHeader({ authorName, onClose }: ModalHeaderProps) {
  return (
    <div className="relative flex shrink-0 items-center justify-center border-b border-fb-divider px-4 py-[14px]">
      <h2 className="text-[17px] font-bold text-fb-text">
        Postingan {authorName}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 flex size-[32px] items-center justify-center rounded-full bg-fb-surface transition-colors hover:bg-fb-hover focus:outline-none"
          aria-label="Tutup"
        >
          <span className="text-[15px] font-semibold text-fb-text">x</span>
        </button>
      )}
    </div>
  )
}
