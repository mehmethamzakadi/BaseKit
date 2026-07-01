import { useState } from 'react'
import { useField } from 'formik'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

/** Formik'e bağlı, etiket + hata gösterimi olan metin girişi.
 *  `type="password"` için göster/gizle düğmesi otomatik eklenir. */
export default function TextField({ label, className, type, ...props }: TextFieldProps) {
  const [field, meta] = useField(props.name)
  const hasError = Boolean(meta.touched && meta.error)
  const isPassword = type === 'password'
  const [reveal, setReveal] = useState(false)
  const effectiveType = isPassword && reveal ? 'text' : type

  return (
    <div className="space-y-1">
      <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={props.name}
          {...field}
          {...props}
          type={effectiveType}
          aria-invalid={hasError}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            isPassword ? 'pr-10' : ''
          } ${
            hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-700'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100 dark:border-slate-600'
          } ${className ?? ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={reveal ? 'Şifreyi gizle' : 'Şifreyi göster'}
            title={reveal ? 'Şifreyi gizle' : 'Şifreyi göster'}
            tabIndex={-1}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hasError && <p className="text-xs text-red-600 dark:text-red-400">{meta.error}</p>}
    </div>
  )
}
