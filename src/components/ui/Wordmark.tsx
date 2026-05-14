interface WordmarkProps {
  size?: number;
}

export function Wordmark({ size = 22 }: WordmarkProps): JSX.Element {
  return (
    <span
      className="nav-brand"
      style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 2 }}
    >
      Studio<span className="dot" />
    </span>
  );
}
