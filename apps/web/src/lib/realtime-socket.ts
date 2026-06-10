import type { AppNotification } from '@ppwl/shared'

type RealtimeSocketCallbacks = {
  onConnected: () => void
  onDisconnected: () => void
  onError: (message: string) => void
  onNotification: (notification: AppNotification) => void
  onFeedChanged: (payload: Record<string, unknown>) => void
}

type RealtimeMessage = {
  type?: string
  notification?: AppNotification
  [key: string]: unknown
}

const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30_000

let socket: WebSocket | null = null
let reconnectTimeoutId: number | null = null
let reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS
let shouldReconnect = false
let currentUrl: string | null = null
let currentToken: string | null = null
let callbacks: RealtimeSocketCallbacks | null = null

function clearReconnectTimer() {
  if (reconnectTimeoutId !== null) {
    window.clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }
}

/**
 * Jadwalkan koneksi ulang dengan exponential backoff. API Gateway memutus
 * koneksi idle (~10 menit), tanpa reconnect fitur realtime mati diam-diam
 * sampai halaman di-reload.
 */
function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimeoutId !== null) return

  reconnectTimeoutId = window.setTimeout(() => {
    reconnectTimeoutId = null
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS)
    openSocket()
  }, reconnectDelayMs)
}

function handleMessage(event: MessageEvent) {
  try {
    // as: JSON.parse mengembalikan any; bentuk pesan ditentukan oleh backend
    // broadcast dan divalidasi field-per-field sebelum dipakai.
    const payload = JSON.parse(String(event.data)) as RealtimeMessage

    if (payload.type === 'notification' && payload.notification) {
      callbacks?.onNotification(payload.notification)
    } else if (payload.type === 'feed_changed') {
      callbacks?.onFeedChanged(payload)
    }
  } catch {
    callbacks?.onError('Pesan realtime tidak valid.')
  }
}

function openSocket() {
  if (!currentUrl || !currentToken) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  socket = new WebSocket(`${currentUrl}?token=${encodeURIComponent(currentToken)}`)

  socket.addEventListener('open', () => {
    reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS
    callbacks?.onConnected()
  })

  socket.addEventListener('message', handleMessage)

  socket.addEventListener('close', () => {
    socket = null
    callbacks?.onDisconnected()
    scheduleReconnect()
  })

  socket.addEventListener('error', () => {
    callbacks?.onError('Koneksi realtime gagal.')
  })
}

export function connectRealtimeSocket(
  url: string,
  token: string,
  nextCallbacks: RealtimeSocketCallbacks,
): void {
  currentUrl = url
  currentToken = token
  callbacks = nextCallbacks
  shouldReconnect = true
  clearReconnectTimer()
  openSocket()
}

export function disconnectRealtimeSocket(): void {
  shouldReconnect = false
  clearReconnectTimer()
  reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS
  currentToken = null
  callbacks = null
  socket?.close()
  socket = null
}
