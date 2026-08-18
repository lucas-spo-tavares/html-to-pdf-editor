import type { ReactNode } from 'react';

type StaticAccordionPanelProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function StaticAccordionPanel({ title, icon, children }: StaticAccordionPanelProps) {
  return (
    <section className="panel accordion-panel open">
      <div className="static-panel-heading">
        <span className="accordion-title">
          {icon}
          <span>{title}</span>
        </span>
      </div>
      <div className="accordion-content">{children}</div>
    </section>
  );
}
