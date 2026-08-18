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
  selectedId: string;
  draggingId?: string;
  showBoxModel: boolean;
  objectDragRef: MutableRefObject<ObjectDragState>;
  onSelect: (id: string) => void;
  onStartDragging: (id: string) => void;
  nested?: boolean;
};

const objectStyle = (object: EditorObject, unit: Unit, selected: boolean): CSSProperties => ({
  left: `${object.frame.x}${unit}`,
  top: `${object.frame.y}${unit}`,
  width: `${object.frame.width}${unit}`,
  height: `${object.frame.height}${unit}`,
  background: object.style.background,
  color: object.style.color,
  border: object.style.border,
  outline: selected ? '1.5px solid #1570ef' : undefined,
  borderRadius: object.style.borderRadius === undefined ? undefined : `${object.style.borderRadius}${unit}`,
  padding: object.style.padding === undefined ? undefined : `${object.style.padding}${unit}`,
  fontSize: object.style.fontSize === undefined ? undefined : `${object.style.fontSize}pt`,
  fontWeight: object.style.fontWeight,
  lineHeight: object.style.lineHeight,
  textAlign: object.style.textAlign,
  display: object.style.display,
  flexDirection: object.style.flexDirection,
  alignItems: object.style.alignItems,
  justifyContent: object.style.justifyContent,
  gap: object.style.gap === undefined ? undefined : `${object.style.gap}${unit}`,
});

export function EditorCanvasObject({
  object,
  unit,
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
      style={objectStyle(object, unit, selected)}
      tabIndex={0}
    >
      {showBoxModel && padding > 0 && (
        <span
          className="padding-overlay"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, rgb(111 207 151 / 35%) 0 ${padding}${unit}, transparent ${padding}${unit}),
              linear-gradient(to top, rgb(111 207 151 / 35%) 0 ${padding}${unit}, transparent ${padding}${unit}),
              linear-gradient(to right, rgb(111 207 151 / 35%) 0 ${padding}${unit}, transparent ${padding}${unit}),
              linear-gradient(to left, rgb(111 207 151 / 35%) 0 ${padding}${unit}, transparent ${padding}${unit})
            `,
          }}
        />
      )}
      {content}
      {selected && <span className="selection-label">{object.type}</span>}
    </div>
  );
}
