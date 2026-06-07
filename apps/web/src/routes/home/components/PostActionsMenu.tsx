import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

type PostActionsMenuProps = {
  isOwner: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}

export function PostActionsMenu({ isOwner, isDeleting, onEdit, onDelete }: PostActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menu postingan"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-20 w-52 rounded-lg bg-white p-2 shadow-xl ring-1 ring-black/10">
          {isOwner ? (
            <>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => { setIsOpen(false); onEdit() }}
              >
                <Pencil size={17} className="shrink-0" aria-hidden="true" />
                Edit postingan
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={onDelete}
              >
                <Trash2 size={17} aria-hidden="true" />
                {isDeleting ? 'Menghapus...' : 'Hapus postingan'}
              </button>
            </>
          ) : (
            <p className="px-3 py-2 text-sm font-medium text-gray-500">Tidak ada aksi tersedia.</p>
          )}
        </div>
      )}
    </div>
  )
}
