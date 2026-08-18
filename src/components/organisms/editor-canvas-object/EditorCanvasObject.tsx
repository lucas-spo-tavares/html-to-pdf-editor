import type { CSSProperties, MutableRefObject } from 'react';
import type { EditorObject, Unit } from '@/editor/document/types';

type ObjectDragState = {
  pointerId: number;
  objectId: string;
  x: number;
  y: number;
  frameX: number;
  frameY: number;
};

type EditorCanvasObjectProps = {
  object: EditorObject;
  unit: Unit;
  zoom: number;
  selectedId: string;
  draggingId?: string;
  showBoxModel: boolean;
  objectDragRef: MutableRefObject<ObjectDragState>;
  onSelect: (id: string) => void;
  onStartDragging: (id: string) => void;
  nested?: boolean;
};

const scaledUnit = (value: number, unit: Unit, zoom: number) => `calc(${value}${unit} * ${zoom})`;

const objectStyle = (object: EditorObject, unit: Unit, zoom: number, selected: boolean): CSSProperties => ({
  left: scaledUnit(object.frame.x, unit, zoom),
  top: scaledUnit(object.frame.y, unit, zoom),
  width: scaledUnit(object.frame.width, unit, zoom),
  height: scaledUnit(object.frame.height, unit, zoom),
  background: object.style.background,
  color: object.style.color,
  border: object.style.border,
  outline: selected ? '1.5px solid #1570ef' : undefined,
  borderRadius: object.style.borderRadius === undefined ? undefined : scaledUnit(object.style.borderRadius, unit, zoom),
  padding: object.style.padding === undefined ? undefined : scaledUnit(object.style.padding, unit, zoom),
  fontSize: object.style.fontSize === undefined ? undefined : `calc(${object.style.fontSize}pt * ${zoom})`,
  fontWeight: object.style.fontWeight,
  lineHeight: object.style.lineHeight,
  textAlign: object.style.textAlign,
  display: object.style.display,
  flexDirection: object.style.flexDirection,
  alignItems: object.style.alignItems,
  justifyContent: object.style.justifyContent,
  gap: object.style.gap === undefined ? undefined : scaledUnit(object.style.gap, unit, zoom),
});

export function EditorCanvasObject({
  object,
  unit,
  zoom,
  selectedId,
  draggingId,
  showBoxModel,
  objectDragRef,
  onSelect,
  onStartDragging,
  nested = false,
}: EditorCanvasObjectProps) {
  const selected = selectedId === object.id;
  const dragging = draggingId === object.id;
  const padding = object.style.padding ?? 0;
  const content =
    object.type === 'text' ? (
      <span>{object.content ?? ''}</span>
    ) : (
      object.children?.map((child) => (
        <EditorCanvasObject
          draggingId={draggingId}
          key={child.id}
          nested={object.style.display === 'flex'}
          object={child}
          objectDragRef={objectDragRef}
          onSelect={onSelect}
          onStartDragging={onStartDragging}
          selectedId={selectedId}
          showBoxModel={showBoxModel}
          unit={unit}
          zoom={zoom}
        />
      ))
    );

  const selectObject = () => onSelect(object.id);

  return (
    <div
      className={`${nested ? 'canvas-child-object' : 'canvas-object'}${dragging ? ' dragging' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        selectObject();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        objectDragRef.current = {
          pointerId: event.pointerId,
          objectId: object.id,
          x: event.clientX,
          y: event.clientY,
          frameX: object.frame.x,
          frameY: object.frame.y,
        };
        onSelect(object.id);
        onStartDragging(object.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          selectObject();
        }
      }}
      role="button"
      style={objectStyle(object, unit, zoom, selected)}
      tabIndex={0}
    >
      {showBoxModel && padding > 0 && (
        <span
          className="padding-overlay"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, rgb(111 207 151 / 35%) 0 ${scaledUnit(padding, unit, zoom)}, transparent ${scaledUnit(padding, unit, zoom)}),
              linear-gradient(to top, rgb(111 207 151 / 35%) 0 ${scaledUnit(padding, unit, zoom)}, transparent ${scaledUnit(padding, unit, zoom)}),
              linear-gradient(to right, rgb(111 207 151 / 35%) 0 ${scaledUnit(padding, unit, zoom)}, transparent ${scaledUnit(padding, unit, zoom)}),
              linear-gradient(to left, rgb(111 207 151 / 35%) 0 ${scaledUnit(padding, unit, zoom)}, transparent ${scaledUnit(padding, unit, zoom)})
            `,
          }}
        />
      )}
      {content}
      {selected && <span className="selection-label">{object.type}</span>}
    </div>
  );
}
