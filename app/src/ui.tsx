import { createContext, useContext, type ReactNode } from 'react';
import type { Action, State } from './state';
import type { ContentStatus } from './content';

export const JourneyContext = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney outside provider');
  return ctx;
}

export function Screen({ title, eyebrow, children, footer }: { title?: string; eyebrow?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="screen">
      <div className="screen-body">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1 className="screen-title">{title}</h1>}
        {children}
      </div>
      {footer && <div className="screen-footer">{footer}</div>}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/** Label shown on any health-adjacent content. "Reviewed" is only ever shown for reviewed content (D-036). */
export function ContentLabel({ status, source }: { status: ContentStatus; source?: string }) {
  if (status === 'reviewed') {
    return (
      <span className="badge badge-reviewed" title={source}>
        ✓ Reviewed information{source ? ` · ${source}` : ''}
      </span>
    );
  }
  return <span className="badge badge-placeholder">Placeholder · pending clinical review</span>;
}

export function DemoBadge({ children }: { children: ReactNode }) {
  return <span className="badge badge-demo">{children}</span>;
}

export function Choice({
  selected,
  onClick,
  children,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <button type="button" className={`choice ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={onClick}>
      <span className="choice-label">{children}</span>
      {hint && <span className="choice-hint">{hint}</span>}
    </button>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className={`toggle ${disabled ? 'is-disabled' : ''}`}>
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
