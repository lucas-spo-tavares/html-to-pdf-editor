import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/atoms/button/Button';

type AccordionPanelProps = {
  id: string;
  title: string;
  icon?: ReactNode;
  titleMeta?: ReactNode;
  openPanels: Set<string>;
  onToggle: (id: string) => void;
  children: ReactNode;
};

export function AccordionPanel({ id, title, icon, titleMeta, openPanels, onToggle, children }: AccordionPanelProps) {
  const open = openPanels.has(id);

  return (
    <section className={open ? 'panel accordion-panel open' : 'panel accordion-panel'}>
      <Button
        aria-expanded={open}
        className="accordion-trigger"
        onClick={() => onToggle(id)}
      >
        <span className="accordion-title">
          {icon}
          <span>{title}</span>
          {titleMeta}
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </Button>
      {open && <div className="accordion-content">{children}</div>}
    </section>
  );
}
