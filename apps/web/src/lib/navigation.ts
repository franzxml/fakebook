export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function notifyAuthStorageChanged() {
  window.dispatchEvent(new StorageEvent('storage', { key: 'user' }))
}
