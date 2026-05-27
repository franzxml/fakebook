export const routePaths = {
  login: '/auth',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  home: '/home',
  postDetail: '/posts/:postId',
  notifications: '/notifications',
  profile: '/profile',
  users: '/users',
  publicUserProfile: '/users/:userId',
} as const

export { ForgotPasswordPage, LoginPage, RegisterPage } from './auth'
export { HomePage } from './home'
export { NotificationsPage } from './notifications'
export { PostDetailPage } from './posts'
export { ProfilePage } from './profile'
export { PublicUserProfilePage, UsersPage } from './users'
