import type { ReactNode } from 'react';

type SidePanelProps = {
  children: ReactNode;
  className: string;
};

export function SidePanel({ children, className }: SidePanelProps) {
  return <aside className={className}>{children}</aside>;
}
