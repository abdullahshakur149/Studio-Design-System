export function FullPageSpinner(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <span className="btn-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
    </div>
  );
}
