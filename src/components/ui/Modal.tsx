import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onOpenChange, title, description, children, footer, maxWidth = 440 }: ModalProps): JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-scrim" />
        <Dialog.Content className="modal" style={{ maxWidth }}>
          <div className="modal-body">
            <Dialog.Title className="modal-title">{title}</Dialog.Title>
            {description && <Dialog.Description className="modal-text">{description}</Dialog.Description>}
            {children}
          </div>
          {footer && <div className="modal-foot">{footer}</div>}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'inline-flex',
              }}
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
