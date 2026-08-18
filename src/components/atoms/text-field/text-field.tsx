import type { InputHTMLAttributes } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  stacked?: boolean;
};

export function TextField({ label, stacked = false, className, ...props }: TextFieldProps) {
  const classes = ['control-field', stacked ? 'stacked' : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <span>{label}</span>
      <input {...props} type="text" />
    </label>
  );
}
