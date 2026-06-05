import { useState } from 'react'
import { register } from '@/services/api'
import { navigate } from '@/lib/navigation'

const passwordPunctuationPattern = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

type TouchedFields = {
  name: boolean
  contact: boolean
  username: boolean
  password: boolean
}

export function useRegisterForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    contact: false,
    username: false,
    password: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const trimmedUsername = username.trim().toLowerCase()
  const trimmedContact = contact.trim()
  const isEmailContact = trimmedContact.includes('@')
  const isPhoneContact = /^[\d\s()+-]+$/.test(trimmedContact)

  const errors = {
    name: touched.name && (firstName.trim().length < 2 || lastName.trim().length < 2),
    username: touched.username && (
      trimmedUsername.length < 3 || !/^[a-z0-9._]+$/.test(trimmedUsername)
    ),
    contact: touched.contact && (
      trimmedContact.length < 3 ||
      (isEmailContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) ||
      (!isEmailContact && (!isPhoneContact || trimmedContact.replace(/\D/g, '').length < 8))
    ),
    password: touched.password && (
      password.length < 6 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password) ||
      !passwordPunctuationPattern.test(password)
    ),
  }

  function touch(field: keyof TouchedFields) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ name: true, contact: true, username: true, password: true })
    setSubmitError(null)

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)
    const hasNameError = firstName.trim().length < 2 || lastName.trim().length < 2
    const hasUsernameError = trimmedUsername.length < 3 || !/^[a-z0-9._]+$/.test(trimmedUsername)
    const hasPasswordError =
      password.length < 6 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password) ||
      !passwordPunctuationPattern.test(password)

    if (hasNameError || hasUsernameError || hasPasswordError || !isValidEmail || isSubmitting) {
      if (!isValidEmail) {
        setSubmitError('Untuk saat ini registrasi backend membutuhkan alamat email yang valid.')
      } else if (hasUsernameError) {
        setSubmitError('Username minimal 3 karakter dan hanya boleh berisi huruf kecil, angka, titik, atau garis bawah.')
      }
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: trimmedUsername,
        email: trimmedContact,
        password,
      })
      navigate('/home')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Registrasi gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    firstName, setFirstName,
    lastName, setLastName,
    username, setUsername,
    contact, setContact,
    password, setPassword,
    touch,
    errors,
    showPassword, setShowPassword,
    isSubmitting,
    submitError,
    handleSubmit,
  }
}
