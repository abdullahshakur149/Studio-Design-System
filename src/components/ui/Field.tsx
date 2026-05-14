import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldProps {
  label?: string;
  hint?: string | null;
  error?: string | null;
  counter?: string | null;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, counter, htmlFor, children }: FieldProps): JSX.Element {
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <div className="field-error">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      {!error && hint && <div className="help">{hint}</div>}
      {counter && (
        <div className="field-counter" style={{ textAlign: 'right' }}>
          {counter}
        </div>
      )}
    </div>
  );
}
