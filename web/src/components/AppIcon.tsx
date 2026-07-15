interface Props {
  name: string;       // display name (en or zh)
  icon?: string;      // optional emoji fallback
  size?: number;
}

// Deterministic gradient from a string seed
const PALETTES = [
  ['#6366f1', '#8b5cf6'],
  ['#ec4899', '#f43f5e'],
  ['#06b6d4', '#3b82f6'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#f97316'],
  ['#8b5cf6', '#d946ef'],
  ['#14b8a6', '#0ea5e9'],
  ['#ef4444', '#f59e0b'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export default function AppIcon({ name, icon, size = 44 }: Props) {
  const seed = name || '?';
  const [c1, c2] = PALETTES[hash(seed) % PALETTES.length];
  const initial = (seed[0] || '?').toUpperCase();
  return (
    <span style={{
      fontSize: size * 0.42,
      flexShrink: 0,
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      borderRadius: size * 0.24,
      color: '#fff',
      fontWeight: 800,
      boxShadow: `0 4px 12px ${c1}40`,
      userSelect: 'none',
    }}>
      {icon && icon.length <= 2 ? icon : initial}
    </span>
  );
}
