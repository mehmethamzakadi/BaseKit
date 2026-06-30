interface AvatarProps {
  /** Profil fotoğrafı URL'i; yoksa baş harf gösterilir. */
  src?: string | null
  /** Baş harfi türetmek için kullanılan ad (görünen ad ya da e-posta). */
  name?: string | null
  /** Piksel cinsinden kenar uzunluğu. */
  size?: number
  className?: string
}

/** İlk harfi türetir; yoksa "?" döner. */
function initialOf(name?: string | null): string {
  const trimmed = name?.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

/**
 * Yuvarlak avatar: görsel varsa onu, yoksa baş harfi gösterir. Liste, topbar ve
 * profil sayfasında ortak kullanılır.
 */
export default function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const style = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Profil fotoğrafı'}
        style={style}
        className={`rounded-full border border-slate-200 object-cover ${className}`}
      />
    )
  }

  return (
    <span
      style={style}
      className={`inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className}`}
    >
      {initialOf(name)}
    </span>
  )
}
