import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'photo' | 'video' | 'plan' | 'duration';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps): JSX.Element {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
