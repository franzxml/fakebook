import type { ReactNode } from 'react'
import type { AppNotification } from '@/types/social'
import { getDisplayName } from './userDisplay'

export function getNotificationKind(notification: Pick<AppNotification, 'type'>) {
  return notification.type === 'post_like' ? 'like' : 'comment'
}

export function getNotificationText(notification: AppNotification) {
  const actorName = getDisplayName(notification.actor)

  if (notification.type === 'post_like') {
    return `${actorName} menyukai postingan Anda.`
  }

  if (notification.type === 'post_comment') {
    return `${actorName} mengomentari postingan Anda${notification.post?.content ? `: ${notification.post.content}` : '.'}`
  }

  if (notification.type === 'comment_reply') {
    return `${actorName} membalas komentar Anda${notification.post?.content ? ` di postingan: ${notification.post.content}` : '.'}`
  }

  return `${actorName} berinteraksi dengan postingan Anda.`
}

export function getNotificationContent(notification: AppNotification): ReactNode {
  const actorName = getDisplayName(notification.actor)

  if (notification.type === 'post_like') {
    return (
      <>
        <strong>{actorName}</strong> menyukai postingan Anda.
      </>
    )
  }

  if (notification.type === 'post_comment') {
    return (
      <>
        <strong>{actorName}</strong> mengomentari postingan Anda
        {notification.post?.content ? <>: {notification.post.content}</> : '.'}
      </>
    )
  }

  if (notification.type === 'comment_reply') {
    return (
      <>
        <strong>{actorName}</strong> membalas komentar Anda
        {notification.post?.content ? <> di postingan: {notification.post.content}</> : '.'}
      </>
    )
  }

  return (
    <>
      <strong>{actorName}</strong> berinteraksi dengan postingan Anda.
    </>
  )
}
