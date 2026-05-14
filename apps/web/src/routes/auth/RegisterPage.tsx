import { ChevronDown, ChevronLeft, CircleAlert, CircleHelp, Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const footerLinks = [
  'Daftar',
  'Masuk',
  'Messenger',
  'Facebook Lite',
  'Video',
  'Meta Pay',
  'Meta Store',
  'Meta Quest',
  'Ray-Ban Meta',
  'Meta AI',
  'Instagram',
  'Threads',
  'Kebijakan Privasi',
  'Pusat Privasi',
  'Meta di Indonesia',
  'Tentang',
  'Buat Iklan',
  'Buat Halaman',
  'Developer',
  'Karier',
  'Cookie',
  'Pilihan Iklan',
  'Ketentuan',
  'Bantuan',
  'Pengunggahan Kontak & Non-Pengguna',
]

const footerLanguages = [
  'Bahasa Indonesia',
  'English (UK)',
  'Basa Jawa',
  'Bahasa Melayu',
  '日本語',
  'العربية',
  'Français (France)',
  'Bahasa lainnya...',
]

const days = Array.from({ length: 31 }, (_, index) => String(index + 1))
const months = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]
const years = Array.from({ length: 100 }, (_, index) => String(2026 - index))

const registerFieldClass =
  'h-[58px] rounded-[16px] border border-[#ccd0d5] bg-white px-4 text-[17px] font-semibold text-[#1c1e21] outline-none transition placeholder:text-[#606770] focus:border-2 focus:border-[#2f3033]'

const registerErrorFieldClass =
  'h-[58px] rounded-[16px] border border-[#e41e3f] bg-white px-4 text-[17px] font-semibold text-[#1c1e21] outline-none transition placeholder:text-[#e41e3f] focus:border-2 focus:border-[#e41e3f]'

const registerSelectClass =
  'h-[58px] w-full appearance-none rounded-[16px] border border-[#ccd0d5] bg-white px-4 pr-11 text-[17px] font-semibold text-[#606770] outline-none transition focus:border-2 focus:border-[#2f3033]'

const passwordPunctuationPattern = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

function getFooterLinkHref(link: string) {
  return link === 'Masuk' ? '/auth' : '/auth/register'
}

function isFooterLinkInteractive(link: string) {
  return link === 'Daftar' || link === 'Masuk'
}

function SelectField({
  ariaLabel,
  defaultValue,
  options,
}: {
  ariaLabel: string
  defaultValue: string
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        defaultValue=""
        className={registerSelectClass}
      >
        <option value="" disabled>
          {defaultValue}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-6 -translate-y-1/2 text-[#111820]"
        aria-hidden="true"
        strokeWidth={2.6}
      />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[18px] font-bold leading-tight text-[#1c1e21]">
      {children}
    </label>
  )
}

function InfoLabel({
  children,
  isOpen,
  onToggle,
}: {
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
}) {
  return (
    <div className="relative flex items-center gap-2 text-[18px] font-bold leading-tight text-[#1c1e21]">
      <span>{children}</span>
      <button
        type="button"
        aria-label={`Informasi ${children}`}
        aria-expanded={isOpen}
        className="grid size-6 place-items-center rounded-full text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f3033]"
        onClick={onToggle}
      >
        <CircleHelp className="size-5" aria-hidden="true" strokeWidth={2.3} />
      </button>
    </div>
  )
}

export function RegisterPage() {
  const birthdateInfoRef = useRef<HTMLElement | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [isNameTouched, setIsNameTouched] = useState(false)
  const [isContactTouched, setIsContactTouched] = useState(false)
  const [isPasswordTouched, setIsPasswordTouched] = useState(false)
  const [isBirthdateInfoOpen, setIsBirthdateInfoOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const nameError = isNameTouched && (firstName.trim().length < 2 || lastName.trim().length < 2)
  const trimmedContact = contact.trim()
  const isEmailContact = trimmedContact.includes('@')
  const isPhoneContact = /^[\d\s()+-]+$/.test(trimmedContact)
  const contactError =
    isContactTouched &&
    (trimmedContact.length < 3 ||
      (isEmailContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) ||
      (!isEmailContact && (!isPhoneContact || trimmedContact.replace(/\D/g, '').length < 8)))
  const passwordError =
    isPasswordTouched &&
    (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || !passwordPunctuationPattern.test(password))

  useEffect(() => {
    if (!isBirthdateInfoOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (target instanceof Node && birthdateInfoRef.current?.contains(target)) {
        return
      }

      setIsBirthdateInfoOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isBirthdateInfoOpen])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsNameTouched(true)
  }

  return (
    <main className="min-h-screen bg-white text-[#1c1e21]">
      <section className="mx-auto w-full max-w-[620px] px-5 pt-8 sm:px-6 lg:max-w-[680px]">
        <a
          href="/auth"
          aria-label="Kembali ke halaman login"
          className="inline-grid size-10 place-items-center rounded-full text-[#65676b] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]"
        >
          <ChevronLeft className="size-8" aria-hidden="true" strokeWidth={2.2} />
        </a>

        <div className="mt-6 flex items-center gap-2 text-[20px] font-bold leading-none">
          <span className="text-[28px] font-bold leading-none text-[#0866ff]" aria-hidden="true">
            ∞
          </span>
          <span>Meta</span>
        </div>

        <header className="mt-6">
          <h1 className="text-[32px] font-bold leading-tight tracking-normal sm:text-[34px]">
            Mulai di Facebook
          </h1>
          <p className="mt-2 max-w-[610px] text-[20px] font-medium leading-[1.25] text-[#1c1e21] sm:text-[21px]">
            Buat akun untuk terhubung dengan teman, keluarga, dan komunitas orang-orang yang
            memiliki minat yang sama dengan Anda.
          </p>
        </header>

        <form className="mt-7 space-y-7" noValidate onSubmit={handleSubmit}>
          <section className="space-y-3">
            <FieldLabel>Nama</FieldLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="firstName"
                type="text"
                aria-label="Nama depan"
                aria-invalid={nameError ? 'true' : undefined}
                placeholder="Nama depan"
                value={firstName}
                className={nameError ? registerErrorFieldClass : registerFieldClass}
                onBlur={() => setIsNameTouched(true)}
                onChange={(event) => {
                  setFirstName(event.target.value)
                  setIsNameTouched(true)
                }}
              />
              <input
                name="lastName"
                type="text"
                aria-label="Nama belakang"
                aria-invalid={nameError ? 'true' : undefined}
                placeholder="Nama belakang"
                value={lastName}
                className={nameError ? registerErrorFieldClass : registerFieldClass}
                onBlur={() => setIsNameTouched(true)}
                onChange={(event) => {
                  setLastName(event.target.value)
                  setIsNameTouched(true)
                }}
              />
            </div>
            {nameError ? (
              <p className="text-[17px] font-medium leading-[1.35] text-[#e41e3f]" role="alert">
                Nama depan atau nama belakang di Facebook tidak boleh terlalu pendek.{' '}
                <span className="font-bold text-[#0866e8]">
                  Learn more
                </span>{' '}
                tentang kebijakan nama kami.
              </p>
            ) : null}
          </section>

          <section ref={birthdateInfoRef} className="relative space-y-3">
            <InfoLabel
              isOpen={isBirthdateInfoOpen}
              onToggle={() => setIsBirthdateInfoOpen((isOpen) => !isOpen)}
            >
              Tanggal lahir
            </InfoLabel>
            {isBirthdateInfoOpen ? (
              <div
                className="absolute left-0 top-8 z-20 max-w-[500px] rounded-[26px] bg-white px-5 py-4 text-[17px] font-medium leading-snug text-[#1c1e21] shadow-[0_8px_32px_rgba(0,0,0,0.16)] sm:left-[210px] sm:top-1"
                role="dialog"
                aria-label="Informasi tanggal lahir"
              >
                Memberikan tanggal lahir Anda membantu memastikan Anda mendapatkan pengalaman
                Facebook yang tepat sesuai usia Anda. Jika Anda ingin mengubah siapa yang melihat
                ini, buka bagian Tentang pada profil Anda. Untuk rincian selengkapnya, buka{' '}
                <span className="font-bold text-[#0866e8]">Kebijakan Privasi</span> kami.
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField ariaLabel="Hari lahir" defaultValue="Hari" options={days} />
              <SelectField ariaLabel="Bulan lahir" defaultValue="Bulan" options={months} />
              <SelectField ariaLabel="Tahun lahir" defaultValue="Tahun" options={years} />
            </div>
          </section>

          <section className="space-y-3">
            <InfoLabel>Jenis kelamin</InfoLabel>
            <SelectField
              ariaLabel="Jenis kelamin"
              defaultValue="Pilih jenis kelamin Anda"
              options={['Perempuan', 'Laki-laki', 'Khusus']}
            />
          </section>

          <section className="space-y-3">
            <FieldLabel>Nomor ponsel atau email</FieldLabel>
            <input
              name="contact"
              type="text"
              aria-label="Nomor ponsel atau email"
              aria-invalid={contactError ? 'true' : undefined}
              placeholder="Nomor ponsel atau email"
              value={contact}
              className={`${contactError ? registerErrorFieldClass : registerFieldClass} w-full`}
              onBlur={() => setIsContactTouched(true)}
              onChange={(event) => {
                setContact(event.target.value)
                setIsContactTouched(true)
              }}
            />
            {contactError ? (
              <p className="flex gap-2 text-[17px] font-medium leading-[1.35] text-[#e41e3f]" role="alert">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" strokeWidth={2.2} />
                <span>Harap masukkan nomor telepon atau alamat email yang valid.</span>
              </p>
            ) : (
              <p className="text-[17px] font-medium leading-[1.25] text-[#1c1e21]">
                Anda mungkin menerima notifikasi dari kami.{' '}
                <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                  Pelajari cara kami menanyakan informasi kontak Anda
                </a>
              </p>
            )}
          </section>

          <section className="space-y-3">
            <FieldLabel>Kata sandi</FieldLabel>
            <label className="relative block">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                aria-label="Kata sandi"
                aria-invalid={passwordError ? 'true' : undefined}
                placeholder=" "
                value={password}
                className={`peer h-[72px] w-full rounded-[16px] border bg-white px-4 pb-2 pt-8 pr-14 text-[17px] font-semibold text-[#1c1e21] outline-none transition placeholder:text-transparent focus:border-2 ${
                  passwordError ? 'border-[#e41e3f] focus:border-[#e41e3f]' : 'border-[#ccd0d5] focus:border-[#2f3033]'
                }`}
                onBlur={() => setIsPasswordTouched(true)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setIsPasswordTouched(true)
                }}
              />
              <span
                className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold transition-all peer-focus:top-4 peer-focus:translate-y-0 peer-focus:text-[15px] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[15px] ${
                  passwordError ? 'text-[#e41e3f]' : 'text-[#606770]'
                }`}
              >
                Kata sandi
              </span>
              {password.length > 0 ? (
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f3033]"
                  onClick={() => setShowPassword((isShown) => !isShown)}
                >
                  {showPassword ? (
                    <Eye className="size-6" aria-hidden="true" strokeWidth={2.8} />
                  ) : (
                    <EyeOff className="size-6" aria-hidden="true" strokeWidth={2.8} />
                  )}
                </button>
              ) : null}
            </label>
            {passwordError ? (
              <p className="flex gap-2 text-[17px] font-medium leading-[1.35] text-[#e41e3f]" role="alert">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" strokeWidth={2.2} />
                <span>
                  Masukkan kombinasi dari setidaknya enam angka, huruf, dan tanda baca (misalnya ! dan &).
                </span>
              </p>
            ) : null}
          </section>

          <section className="space-y-5 pt-4 text-[17px] font-medium leading-[1.25] text-[#1c1e21]">
            <p>
              Orang yang menggunakan layanan kami mungkin telah mengunggah informasi kontak Anda ke
              Facebook.{' '}
              <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                Pelajari selengkapnya.
              </a>
            </p>
            <p>
              Dengan mengetuk Kirim, Anda menyetujui pembuatan akun serta{' '}
              <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                Ketentuan
              </a>
              ,{' '}
              <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                Kebijakan Privasi
              </a>
              , dan{' '}
              <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                Kebijakan Cookie
              </a>{' '}
              Facebook.
            </p>
            <p>
              <a href="/auth" className="font-bold text-[#0866e8] hover:underline">
                Kebijakan Privasi
              </a>{' '}
              menjelaskan cara kami dapat menggunakan informasi yang kami kumpulkan saat Anda membuat
              akun. Misalnya, kami menggunakan informasi ini untuk menyediakan, mempersonalisasi, dan
              meningkatkan produk kami, termasuk iklan.
            </p>
          </section>

          <div className="space-y-3 pb-3">
            <button
              type="submit"
              className="h-[52px] w-full rounded-full bg-[#0866e8] px-6 text-[19px] font-bold text-white transition hover:bg-[#075bce] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/25"
            >
              Kirim
            </button>
            <a
              href="/auth"
              className="flex h-[52px] w-full items-center justify-center rounded-full border border-[#d8dce1] px-6 text-[18px] font-bold text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/20"
            >
              Saya sudah punya akun
            </a>
          </div>
        </form>
      </section>

      <footer className="mx-auto mt-10 max-w-[1020px] px-5 pb-8 pt-5 text-[15px] font-medium leading-[1.45] text-[#65676b] sm:px-6">
        <div className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Bahasa" role="list">
          {footerLanguages.map((language) => (
            <span key={language} role="listitem">
              {language}
            </span>
          ))}
        </div>

        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Tautan Facebook">
          {footerLinks.map((link) => (
            isFooterLinkInteractive(link) ? (
              <a key={link} href={getFooterLinkHref(link)} className="hover:underline">
                {link}
              </a>
            ) : (
              <span key={link}>{link}</span>
            )
          ))}
        </nav>
        <p className="mt-5">Meta © 2026</p>
      </footer>
    </main>
  )
}
