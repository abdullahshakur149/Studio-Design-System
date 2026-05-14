function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function studioFilename(kind: 'photo' | 'video', ext: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `studio-${kind}-${yyyy}-${mm}-${dd}-${hh}${min}${ss}.${ext}`;
}
