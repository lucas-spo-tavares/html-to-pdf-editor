import type { Unit } from '@/editor/document/types';

type RulerTick = {
  value: number;
  position: number;
  isMajor: boolean;
  label: string;
};

type EditorRulerProps = {
  horizontalTicks: RulerTick[];
  pointer?: { x: number; y: number };
  rulerSize: number;
  unit: Unit;
  verticalTicks: RulerTick[];
};

export function EditorRuler({ horizontalTicks, pointer, rulerSize, unit, verticalTicks }: EditorRulerProps) {
  return (
    <div className="canvas-rulers" aria-hidden="true">
      <div className="ruler-corner" />
      <div className="ruler horizontal">
        {horizontalTicks.map((tick) => (
          <span className={tick.isMajor ? 'ruler-tick major' : 'ruler-tick'} key={`x-${tick.value}`} style={{ left: tick.position }}>
            {tick.label && <span className="ruler-label">{tick.label}</span>}
          </span>
        ))}
        {pointer && <span className="ruler-follow-tick horizontal" style={{ left: pointer.x - rulerSize }} />}
        <span className="ruler-unit">{unit}</span>
      </div>
      <div className="ruler vertical">
        {verticalTicks.map((tick) => (
          <span className={tick.isMajor ? 'ruler-tick major' : 'ruler-tick'} key={`y-${tick.value}`} style={{ top: tick.position }}>
            {tick.label && <span className="ruler-label">{tick.label}</span>}
          </span>
        ))}
        {pointer && <span className="ruler-follow-tick vertical" style={{ top: pointer.y - rulerSize }} />}
        <span className="ruler-unit">{unit}</span>
      </div>
    </div>
  );
}
