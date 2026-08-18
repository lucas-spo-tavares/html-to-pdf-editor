import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'icon' | 'tab' | 'boxModel' | 'copy' | 'treeToggle' | 'treeSelect' | 'pageThumb';
type ButtonColor = 'neutral' | 'primary' | 'success' | 'dark';
type ButtonFloating = boolean | 'export';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  color?: ButtonColor;
  floating?: ButtonFloating;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: '',
  icon: 'icon-button',
  tab: 'mode-tab',
  boxModel: 'box-model-button',
  copy: 'copy-code-button',
  treeToggle: 'tree-toggle',
  treeSelect: 'tree-select',
  pageThumb: 'page-thumb',
};

const colorClasses: Record<ButtonColor, string> = {
  neutral: '',
  primary: 'primary-button',
  success: 'success-button',
  dark: 'dark-button',
};

const floatingClasses: Record<Exclude<ButtonFloating, boolean>, string> = {
  export: 'floating-export',
};

export function Button({
  active = false,
  color = 'neutral',
  floating = false,
  variant = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    variantClasses[variant],
    colorClasses[color],
    floating === true ? 'floating-button' : '',
    typeof floating === 'string' ? floatingClasses[floating] : '',
    active ? 'active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={classes || undefined} type={type} {...props} />;
}
