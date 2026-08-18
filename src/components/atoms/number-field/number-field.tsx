import type { InputHTMLAttributes } from 'react';

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  stacked?: boolean;
};

export function NumberField({ label, stacked = false, className, ...props }: NumberFieldProps) {
  const classes = ['control-field', stacked ? 'stacked' : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <span>{label}</span>
      <input {...props} type="number" />
    </label>
  );
}
