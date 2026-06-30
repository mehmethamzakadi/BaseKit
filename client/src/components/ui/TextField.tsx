import { useField } from 'formik'
import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

/** Formik'e bağlı, etiket + hata gösterimi olan metin girişi. */
export default function TextField({ label, className, ...props }: TextFieldProps) {
  const [field, meta] = useField(props.name)
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <div className="space-y-1">
      <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={props.name}
        {...field}
        {...props}
        aria-invalid={hasError}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-700'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100 dark:border-slate-600'
        } ${className ?? ''}`}
      />
      {hasError && <p className="text-xs text-red-600 dark:text-red-400">{meta.error}</p>}
    </div>
  )
}
