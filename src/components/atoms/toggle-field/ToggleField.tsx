import type { InputHTMLAttributes } from 'react';

type ToggleFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export function ToggleField({ label, className, ...props }: ToggleFieldProps) {
  const classes = ['toggle-field', className ?? ''].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <span>{label}</span>
      <input {...props} type="checkbox" />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}
