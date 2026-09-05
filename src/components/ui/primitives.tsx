import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type StaticIconName } from './Icon';

export type ButtonVariant = 'default' | 'primary' | 'accent' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: string;
  iconRight?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'default', size = 'md', icon, iconRight, className = '', children, type = 'button', ...rest }, ref) {
  const v = variant === 'default' ? '' : `btn-${variant}`;
  return (
    <button ref={ref} type={type} className={`btn ${v} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={14} /> : null}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  size?: number;
  active?: boolean;
  tooltip?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ icon, label, size = 16, active, tooltip = true, className = '', type = 'button', ...rest }, ref) {
  const btn = (
    <button ref={ref} type={type} className={`icon-btn ${className}`} aria-label={label} data-active={active ? 'true' : undefined} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
  if (!tooltip) return btn;
  return <Tooltip label={label}>{btn}</Tooltip>;
});

export function Tooltip({ label, children, side = 'bottom' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={500}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-[60] rounded-control border border-line-strong bg-surface2 px-2 py-1 text-[0.85em] text-text shadow-md">
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const TooltipProvider = TooltipPrimitive.Provider;

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Shortcut({ keys }: { keys: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.split('+').map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
    </span>
  );
}

export function Switch({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 rounded-full border border-line-strong bg-surface2 transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-text transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-accent" />
    </SwitchPrimitive.Root>
  );
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  /** Full screen on mobile. */
  sheet?: boolean;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, width = 'md' }: DialogProps) {
  const { t } = useTranslation();
  const w = width === 'sm' ? 'max-w-sm' : width === 'lg' ? 'max-w-3xl' : 'max-w-lg';
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className={`panel fixed top-1/2 left-1/2 z-50 flex max-h-[min(90dvh,720px)] w-[calc(100%-24px)] ${w} -translate-x-1/2 -translate-y-1/2 flex-col outline-none fade-in`}>
          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-[1.05em] font-semibold">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="mt-0.5 text-[0.9em] text-muted">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{typeof title === 'string' ? title : ''}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton icon="x" label={t('common.close')} tooltip={false} />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface MenuItemSpec {
  id: string;
  label: ReactNode;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onSelect?: () => void;
  separatorBefore?: boolean;
  children?: MenuItemSpec[];
}

export function Menu({ trigger, items, align = 'end', label }: { trigger: ReactNode; items: MenuItemSpec[]; align?: 'start' | 'end' | 'center'; label?: string }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild aria-label={label}>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={4} className="menu fade-in" onCloseAutoFocus={(e) => e.preventDefault()}>
          {items.map((item) => (
            <MenuEntry key={item.id} item={item} />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuEntry({ item }: { item: MenuItemSpec }) {
  const body = (
    <>
      {item.icon ? <Icon name={item.icon} size={15} className="text-muted" /> : item.checked !== undefined ? <Icon name={item.checked ? 'check' : 'circle'} size={15} className={item.checked ? 'text-accent' : 'text-dim opacity-40'} /> : null}
      <span className="flex-1 truncate">{item.label}</span>
      {item.shortcut ? <span className="ml-3 text-[0.8em] text-dim">{item.shortcut}</span> : null}
    </>
  );
  if (item.children) {
    return (
      <>
        {item.separatorBefore ? <DropdownMenu.Separator className="menu-sep" /> : null}
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger className="menu-item" disabled={item.disabled}>
            {body}
            <Icon name="chevron-right" size={14} className="text-dim" />
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent className="menu fade-in" sideOffset={4}>
              {item.children.map((c) => (
                <MenuEntry key={c.id} item={c} />
              ))}
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub>
      </>
    );
  }
  return (
    <>
      {item.separatorBefore ? <DropdownMenu.Separator className="menu-sep" /> : null}
      <DropdownMenu.Item className="menu-item" data-danger={item.danger ? 'true' : undefined} disabled={item.disabled} onSelect={() => item.onSelect?.()}>
        {body}
      </DropdownMenu.Item>
    </>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: StaticIconName | string; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-16 text-center fade-in">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-card border border-line bg-surface text-accent">
        <Icon name={icon} size={22} />
      </div>
      <div className="font-semibold">{title}</div>
      {body ? <div className="text-[0.95em] text-muted">{body}</div> : null}
      {action ? <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-[0.85em] font-semibold tracking-wide text-muted uppercase">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.85em] text-dim">{hint}</span> : null}
    </label>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Icon name="refresh-cw" size={size} className="animate-spin text-muted" />;
}
