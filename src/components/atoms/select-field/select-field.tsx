import type { ReactNode, SelectHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
  stacked?: boolean;
};

export function SelectField({ label, stacked = false, className, children, ...props }: SelectFieldProps) {
  const classes = ['control-field', stacked ? 'stacked' : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}
