type ModalHeaderProps = {
  authorName: string
  onClose?: () => void
}

export function ModalHeader({ authorName, onClose }: ModalHeaderProps) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center px-4 py-[14px]"
      style={{ borderBottom: '1px solid #DADDE1' }}
    >
      <h2 style={{ color: '#050505', fontSize: '17px', fontWeight: 700 }}>
        Postingan {authorName}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 flex size-[32px] items-center justify-center rounded-full transition-colors hover:bg-[#E4E6EB] focus:outline-none"
          style={{ backgroundColor: '#F0F2F5' }}
          aria-label="Tutup"
        >
          <span style={{ color: '#050505', fontSize: '15px', fontWeight: 600 }}>x</span>
        </button>
      )}
    </div>
  )
}
