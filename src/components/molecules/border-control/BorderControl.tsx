type BorderControlProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
};

type BorderParts = {
  width: string;
  style: string;
  color: string;
};

const parseBorder = (border?: string): BorderParts => {
  const parts = border?.trim().split(/\s+/) ?? [];

  return {
    width: parts[0]?.replace('px', '') ?? '',
    style: parts[1] ?? 'solid',
    color: parts.slice(2).join(' ') || '#d0d5dd',
  };
};

const composeBorder = ({ width, style, color }: BorderParts) => {
  if (!width.trim()) return undefined;

  return `${width}px ${style || 'solid'} ${color || '#d0d5dd'}`;
};

export function BorderControl({ value, onChange }: BorderControlProps) {
  const border = parseBorder(value);
  const color = border.color.startsWith('#') ? border.color : '#d0d5dd';

  return (
    <div className="border-control">
      <span>Border</span>
      <input
        min="0"
        onChange={(event) => onChange(composeBorder({ ...border, width: event.target.value }))}
        placeholder="0"
        type="number"
        value={border.width}
      />
      <select onChange={(event) => onChange(composeBorder({ ...border, style: event.target.value }))} value={border.style}>
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
        <option value="double">Double</option>
      </select>
      <input
        onChange={(event) => onChange(composeBorder({ ...border, color: event.target.value }))}
        type="color"
        value={color}
      />
    </div>
  );
}
