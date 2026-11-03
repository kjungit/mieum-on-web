const CENTER = { x: 100, y: 92 };
const RADIUS = 62;
// 위(알레르기) → 오른쪽(연령) → 아래(영양) → 왼쪽(주의 성분) 순서, design-file 캔버스와 동일.
const AXES = [
  { label: "알레르기", unit: { x: 0, y: -1 }, textX: 100, textY: 20 },
  { label: "연령", unit: { x: 1, y: 0 }, textX: 172, textY: 95 },
  { label: "영양", unit: { x: 0, y: 1 }, textX: 100, textY: 170 },
  { label: "주의 성분", unit: { x: -1, y: 0 }, textX: 26, textY: 95 },
] as const;
const GRID_RINGS = [1, 0.67, 0.33];

function ringPoints(scale: number): string {
  return AXES.map((axis) => {
    const x = CENTER.x + axis.unit.x * RADIUS * scale;
    const y = CENTER.y + axis.unit.y * RADIUS * scale;
    return `${x},${y}`;
  }).join(" ");
}

export interface RadarSeries {
  name: string;
  color: string;
  fill: string;
  /** 축 4개(알레르기/연령/영양/주의 성분) 각각 0(위험)~1(안전) 점수. */
  values: [number, number, number, number];
}

export function RadarChart({ series }: { series: RadarSeries[] }) {
  return (
    <div className="rounded-[18px] border border-background-selected bg-background p-3.5">
      <svg viewBox="0 0 200 184" className="block w-full">
        {GRID_RINGS.map((scale) => (
          <polygon key={scale} points={ringPoints(scale)} fill="none" stroke="rgba(22,24,26,0.1)" strokeWidth={1} />
        ))}
        {AXES.map((axis) => (
          <line
            key={axis.label}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={CENTER.x + axis.unit.x * RADIUS}
            y2={CENTER.y + axis.unit.y * RADIUS}
            stroke="rgba(22,24,26,0.09)"
          />
        ))}
        {series.map((s) => (
          <polygon
            key={s.name}
            points={AXES.map((axis, i) => {
              const v = s.values[i];
              const x = CENTER.x + axis.unit.x * RADIUS * v;
              const y = CENTER.y + axis.unit.y * RADIUS * v;
              return `${x},${y}`;
            }).join(" ")}
            fill={s.fill}
            stroke={s.color}
            strokeWidth={2}
          />
        ))}
        {AXES.map((axis) => (
          <text
            key={axis.label}
            x={axis.textX}
            y={axis.textY}
            textAnchor="middle"
            style={{ font: "700 9px 'Noto Sans KR', sans-serif", fill: "rgba(22,24,26,0.55)" }}
          >
            {axis.label}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex justify-center gap-4">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-[10.5px] font-medium text-text-secondary">{s.name}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[10px] leading-relaxed text-text-secondary/70">
        바깥쪽일수록 안전한 항목이에요. 등급이 같아도 어떤 항목에서 걸리는지는 다를 수 있어요.
      </p>
    </div>
  );
}
