const AVATAR_PALETTE = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
];

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatTenure(days: number): string {
  if (days < 30)  return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m ? `${y}y ${m}mo` : `${y}y`;
}

export function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function avatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}
