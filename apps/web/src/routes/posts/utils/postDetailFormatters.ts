export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '1 mnt'
  if (minutes < 60) return `${minutes} mnt`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam`

  return `${Math.floor(hours / 24)} hari`
}

export function formatCount(count: number): string {
  if (count < 1000) return count.toString()
  return `${(count / 1000).toFixed(1).replace('.', ',').replace(',0', '')} rb`
}
