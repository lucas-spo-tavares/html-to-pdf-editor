import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import {
  Braces,
  ChevronDown,
  ChevronRight,
  FileText,
  Grid3X3,
  Layers,
  LocateFixed,
  Minus,
  Palette,
  Plus,
  Ruler,
  SlidersHorizontal,
  Type as TypeIcon,
} from 'lucide-react';
import { AccordionPanel } from '@/components/atoms/accordion-panel/accordion-panel';
import { Button } from '@/components/atoms/button/button';
import { NumberField } from '@/components/atoms/number-field/number-field';
import { SelectField } from '@/components/atoms/select-field/select-field';
import { BorderControl } from '@/components/molecules/border-control/border-control';
import { EditorCanvasObject } from '@/components/organisms/editor-canvas-object/editor-canvas-object';
import { EditorObjectTree } from '@/components/organisms/editor-object-tree/editor-object-tree';
import { EditorRuler } from '@/components/organisms/editor-ruler/editor-ruler';
import { SidePanel } from '@/components/organisms/side-panel/side-panel';
import { sampleDocument } from '@/editor/document/sampleDocument';
import type { EditorDocument, EditorObject, Frame, ObjectStyle, PageSize, Unit } from '@/editor/document/types';
import { jsonEditorExtensions } from '@/plugin/codemirror/extensions/json-editor/json-editor';
import { templateAutocomplete } from '@/plugin/codemirror/extensions/template-autocomplete/template-autocomplete';

type EditViewProps = {
  contextError?: string;
  documentState: EditorDocument;
  lastValidContext: Record<string, unknown>;
  onContextTextChange: (value: string) => void;
  setDocumentState: Dispatch<SetStateAction<EditorDocument>>;
};

const pagePresets: Record<Exclude<PageSize['name'], 'Custom'>, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
};

const presetUnits: Record<Exclude<PageSize['name'], 'Custom'>, typeof sampleDocument.unit> = {
  A4: 'mm',
  A5: 'mm',
  Letter: 'in',
  Legal: 'in',
};

const pixelsPerUnit = {
  px: 1,
  mm: 3.7795275591,
  in: 96,
};

const rulerSize = 30;

const buildRulerTicks = (
  axis: 'horizontal' | 'vertical',
  viewport: { x: number; y: number; zoom: number },
  unit: Unit,
  stageSize: { width: number; height: number },
) => {
  const unitPx = pixelsPerUnit[unit] * viewport.zoom;
  const origin = axis === 'horizontal' ? viewport.x : viewport.y;
  const length = (axis === 'horizontal' ? stageSize.width : stageSize.height) - rulerSize;
  if (length <= 0) return [];

  const majorStep = (140 / unitPx).appNiceCeil();
  const minorStep = majorStep / 5;
  const first = Math.floor((rulerSize - origin) / unitPx / minorStep) * minorStep;
  const last = Math.ceil((length + rulerSize - origin) / unitPx / minorStep) * minorStep;
  const ticks = [];

  for (let value = first; value <= last; value += minorStep) {
    const normalized = Number(value.toFixed(6));
    const position = origin + normalized * unitPx - rulerSize;
    const isMajor = Math.abs(normalized / majorStep - Math.round(normalized / majorStep)) < 0.0001;

    ticks.push({
      value: normalized,
      position,
      isMajor,
      label: isMajor ? normalized.appRulerFormat() : '',
    });
  }

  return ticks;
};

const flattenObjects = (objects: EditorObject[]): EditorObject[] =>
  objects.appFlatTree((object) => object.children);

const updateObjectContent = (objects: EditorObject[], id: string, content: string): EditorObject[] =>
  updateObject(objects, id, (object) => ({ ...object, content }));

const updateObject = (
  objects: EditorObject[],
  id: string,
  updater: (object: EditorObject) => EditorObject,
): EditorObject[] =>
  objects.map((object) => {
    if (object.id === id) {
      return updater(object);
    }

    if (object.children) {
      return {
        ...object,
        children: updateObject(object.children, id, updater),
      };
    }

    return object;
  });

const setNullableNumber = (value: string) => {
  if (value.trim() === '') return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

export function EditView({
  contextError,
  documentState,
  lastValidContext,
  onContextTextChange,
  setDocumentState,
}: EditViewProps) {
  const [selectedId, setSelectedId] = useState('title');
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showBoxModel, setShowBoxModel] = useState(false);
  const [viewport, setViewport] = useState({ x: 260, y: 140, zoom: 1 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [rulerPointer, setRulerPointer] = useState<{ x: number; y: number }>();
  const [isPanning, setIsPanning] = useState(false);
  const [draggingId, setDraggingId] = useState<string>();
  const [openPanels, setOpenPanels] = useState<Set<string>>(
    () => new Set(['context', 'tree', 'object', 'text', 'style']),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['page-1', ...flattenObjects(documentState.objects).map((object) => object.id)]),
  );
  const stageRef = useRef<HTMLElement>(null);
  const panStartRef = useRef({ pointerId: 0, x: 0, y: 0, viewportX: 0, viewportY: 0 });
  const objectDragRef = useRef({
    pointerId: 0,
    objectId: '',
    x: 0,
    y: 0,
    frameX: 0,
    frameY: 0,
  });

  const allObjects = useMemo(() => flattenObjects(documentState.objects), [documentState.objects]);
  const selectedObject = useMemo(
    () => allObjects.find((object) => object.id === selectedId),
    [allObjects, selectedId],
  );
  const horizontalRulerTicks = useMemo(
    () => buildRulerTicks('horizontal', viewport, documentState.unit, stageSize),
    [documentState.unit, stageSize, viewport],
  );
  const verticalRulerTicks = useMemo(
    () => buildRulerTicks('vertical', viewport, documentState.unit, stageSize),
    [documentState.unit, stageSize, viewport],
  );
  const rulerPointerInBounds =
    rulerPointer &&
    rulerPointer.x >= rulerSize &&
    rulerPointer.y >= rulerSize &&
    rulerPointer.x <= stageSize.width &&
    rulerPointer.y <= stageSize.height
      ? rulerPointer
      : undefined;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateStageSize = () => {
      setStageSize({
        width: stage.clientWidth,
        height: stage.clientHeight,
      });
    };

    updateStageSize();

    const observer = new ResizeObserver(updateStageSize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!draggingId) return;

    const moveDragging = (event: PointerEvent) => {
      const drag = objectDragRef.current;
      if (!drag.objectId) return;

      const unitScale = pixelsPerUnit[documentState.unit];
      const deltaX = (event.clientX - drag.x) / viewport.zoom / unitScale;
      const deltaY = (event.clientY - drag.y) / viewport.zoom / unitScale;

      setDocumentState((current) => ({
        ...current,
        objects: updateObject(current.objects, drag.objectId, (object) => ({
          ...object,
          frame: {
            ...object.frame,
            x: drag.frameX + deltaX,
            y: drag.frameY + deltaY,
          },
        })),
      }));
    };

    const stopDragging = () => {
      objectDragRef.current = {
        pointerId: 0,
        objectId: '',
        x: 0,
        y: 0,
        frameX: 0,
        frameY: 0,
      };
      setDraggingId(undefined);
    };

    window.addEventListener('pointermove', moveDragging);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('blur', stopDragging);

    return () => {
      window.removeEventListener('pointermove', moveDragging);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('blur', stopDragging);
    };
  }, [documentState.unit, draggingId, setDocumentState, viewport.zoom]);

  const contextEditorExtensions = useMemo(() => jsonEditorExtensions(), []);
  const templateEditorExtensions = useMemo(
    () => [templateAutocomplete(lastValidContext), EditorView.lineWrapping],
    [lastValidContext],
  );

  const setZoom = (zoom: number) => {
    setViewport((current) => ({
      ...current,
      zoom: Math.min(2, Math.max(0.35, zoom)),
    }));
  };

  const centerCanvas = () => {
    setViewport((current) => ({
      ...current,
      x: 260,
      y: 140,
    }));
  };

  const handleStagePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    panStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
    };
    setIsPanning(true);
  };

  const handleStagePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (showRulers) {
      const stageRect = event.currentTarget.getBoundingClientRect();
      const nextPointer = {
        x: event.clientX - stageRect.left,
        y: event.clientY - stageRect.top,
      };

      setRulerPointer((current) =>
        current && Math.abs(current.x - nextPointer.x) < 0.5 && Math.abs(current.y - nextPointer.y) < 0.5
          ? current
          : nextPointer,
      );
    }

    if (!isPanning || panStartRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - panStartRef.current.x;
    const deltaY = event.clientY - panStartRef.current.y;

    setViewport((current) => ({
      ...current,
      x: panStartRef.current.viewportX + deltaX,
      y: panStartRef.current.viewportY + deltaY,
    }));
  };

  const stopPanning = (event: React.PointerEvent<HTMLElement>) => {
    if (panStartRef.current.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
  };

  const clearRulerPointer = () => {
    setRulerPointer(undefined);
  };

  const updatePageSize = (key: 'width' | 'height', value: string) => {
    setDocumentState((current) => ({
      ...current,
      page: {
        ...current.page,
        size: {
          ...current.page.size,
          name: 'Custom',
          [key]: value.appToNumber(current.page.size[key]),
        },
      },
    }));
  };

  const applyPagePreset = (name: PageSize['name']) => {
    if (name === 'Custom') {
      setDocumentState((current) => ({
        ...current,
        page: {
          ...current.page,
          size: {
            ...current.page.size,
            name: 'Custom',
          },
        },
      }));
      return;
    }

    const preset = pagePresets[name];
    const nextSize =
      documentState.page.orientation === 'landscape'
        ? { width: preset.height, height: preset.width }
        : { width: preset.width, height: preset.height };

    setDocumentState((current) => ({
      ...current,
      unit: presetUnits[name],
      page: {
        ...current.page,
        size: {
          name,
          ...nextSize,
        },
      },
    }));
  };

  const updatePageOrientation = (orientation: 'portrait' | 'landscape') => {
    setDocumentState((current) => {
      if (current.page.orientation === orientation) return current;

      return {
        ...current,
        page: {
          ...current.page,
          orientation,
          size: {
            ...current.page.size,
            width: current.page.size.height,
            height: current.page.size.width,
          },
        },
      };
    });
  };

  const updatePageMargin = (key: keyof typeof documentState.page.margin, value: string) => {
    setDocumentState((current) => ({
      ...current,
      page: {
        ...current.page,
        margin: {
          ...current.page.margin,
          [key]: value.appToNumber(current.page.margin[key]),
        },
      },
    }));
  };

  const updatePageBackground = (value: string) => {
    setDocumentState((current) => ({
      ...current,
      page: {
        ...current.page,
        background: value,
      },
    }));
  };

  const updateSelectedFrame = (key: keyof Frame, value: string) => {
    if (!selectedObject) return;

    setDocumentState((current) => ({
      ...current,
      objects: updateObject(current.objects, selectedObject.id, (object) => ({
        ...object,
        frame: {
          ...object.frame,
          [key]: value.appToNumber(object.frame[key]),
        },
      })),
    }));
  };

  const updateSelectedStyle = <K extends keyof ObjectStyle>(key: K, value: ObjectStyle[K]) => {
    if (!selectedObject) return;

    setDocumentState((current) => ({
      ...current,
      objects: updateObject(current.objects, selectedObject.id, (object) => ({
        ...object,
        style: {
          ...object.style,
          [key]: value,
        },
      })),
    }));
  };

  const togglePanel = (id: string) => {
    setOpenPanels((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTreeItem = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateUnit = (unit: EditorDocument['unit']) => {
    setDocumentState((current) => ({
      ...current,
      unit,
    }));
  };

  const updateSelectedObjectContent = (id: string, value: string) => {
    setDocumentState((current) => ({
      ...current,
      objects: updateObjectContent(current.objects, id, value),
    }));
  };

  return (
    <>
      <div className="canvas-toggles" aria-label="Canvas toggles">
        <Button active={showRulers} onClick={() => setShowRulers((value) => !value)} title="Alternar regua" variant="icon">
          <Ruler size={17} />
        </Button>
        <Button active={showGrid} onClick={() => setShowGrid((value) => !value)} title="Alternar grade" variant="icon">
          <Grid3X3 size={17} />
        </Button>
      </div>

      <div className="canvas-box-toggle" aria-label="Box model toggles">
        <Button
          active={showBoxModel}
          onClick={() => setShowBoxModel((value) => !value)}
          title="Mostrar margens e paddings"
          variant="boxModel"
        >
          <span className="box-swatch margin" />
          <span className="box-swatch padding" />
          Box model
        </Button>
      </div>

      <div className="canvas-zoom" aria-label="Canvas zoom controls">
        <Button onClick={() => setZoom(viewport.zoom - 0.1)} title="Diminuir zoom" variant="icon">
          <Minus size={17} />
        </Button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <Button onClick={() => setZoom(viewport.zoom + 0.1)} title="Aumentar zoom" variant="icon">
          <Plus size={17} />
        </Button>
        <Button onClick={centerCanvas} title="Centralizar canvas" variant="icon">
          <LocateFixed size={17} />
        </Button>
      </div>

      <main className="workspace edit">
        <SidePanel className="page-inspector">
          <AccordionPanel id="page" icon={<FileText size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Page">
            <SelectField
              label="Preset"
              onChange={(event) => applyPagePreset(event.target.value as PageSize['name'])}
              stacked
              value={documentState.page.size.name}
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
              <option value="Custom">Custom</option>
            </SelectField>

            <SelectField
              label="Orientation"
              onChange={(event) => updatePageOrientation(event.target.value as EditorDocument['page']['orientation'])}
              stacked
              value={documentState.page.orientation}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </SelectField>

            <div className="control-grid two">
              <NumberField label="W" min="1" onChange={(event) => updatePageSize('width', event.target.value)} value={documentState.page.size.width} />
              <NumberField label="H" min="1" onChange={(event) => updatePageSize('height', event.target.value)} value={documentState.page.size.height} />
            </div>

            <div className="control-grid two">
              <SelectField label="Unit" onChange={(event) => updateUnit(event.target.value as EditorDocument['unit'])} value={documentState.unit}>
                <option value="mm">mm</option>
                <option value="px">px</option>
                <option value="in">in</option>
              </SelectField>
              <label className="control-field color-field">
                <span>Fill</span>
                <input onChange={(event) => updatePageBackground(event.target.value)} type="color" value={documentState.page.background} />
              </label>
            </div>

            <div className="margin-editor">
              <span>Margins</span>
              <div className="control-grid two">
                {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
                  <NumberField
                    key={key}
                    label={key.slice(0, 1).toUpperCase()}
                    min="0"
                    onChange={(event) => updatePageMargin(key, event.target.value)}
                    value={documentState.page.margin[key]}
                  />
                ))}
              </div>
            </div>
          </AccordionPanel>

          <AccordionPanel id="context" icon={<Braces size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Contexto JSON">
            <div className="codemirror-box json-editor-wrap">
              <CodeMirror
                basicSetup={{
                  foldGutter: true,
                  highlightActiveLine: true,
                  lineNumbers: true,
                }}
                extensions={contextEditorExtensions}
                height="250px"
                onChange={onContextTextChange}
                value={documentState.contextText}
              />
            </div>
            <p className={contextError ? 'status error' : 'status ok'}>
              {contextError ? contextError : 'JSON valido'}
            </p>
          </AccordionPanel>

          <AccordionPanel id="tree" icon={<Layers size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Documento">
            <nav aria-label="Document tree" className="tree-view">
              <div className={selectedId === '' ? 'tree-row root active' : 'tree-row root'}>
                <Button
                  aria-label={expandedIds.has('page-1') ? 'Recolher pagina' : 'Expandir pagina'}
                  onClick={() => toggleTreeItem('page-1')}
                  variant="treeToggle"
                >
                  {expandedIds.has('page-1') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </Button>
                <Button onClick={() => setSelectedId('')} variant="treeSelect">
                  <FileText size={14} />
                  <span>{documentState.page.size.name} page</span>
                  <em>
                    {documentState.page.size.width}x{documentState.page.size.height}
                    {documentState.unit}
                  </em>
                </Button>
              </div>
              {expandedIds.has('page-1') && (
                <ul className="tree-list">
                  {documentState.objects.map((object) => (
                    <EditorObjectTree
                      expandedIds={expandedIds}
                      key={object.id}
                      object={object}
                      onSelect={setSelectedId}
                      onToggle={toggleTreeItem}
                      selectedId={selectedId}
                    />
                  ))}
                </ul>
              )}
            </nav>
          </AccordionPanel>
        </SidePanel>

        <section
          className={isPanning ? 'stage panning' : 'stage edit'}
          onPointerCancel={stopPanning}
          onPointerDown={handleStagePointerDown}
          onPointerLeave={clearRulerPointer}
          onPointerMove={handleStagePointerMove}
          onPointerUp={stopPanning}
          ref={stageRef}
        >
          {showRulers && (
            <EditorRuler
              horizontalTicks={horizontalRulerTicks}
              pointer={rulerPointerInBounds}
              rulerSize={rulerSize}
              unit={documentState.unit}
              verticalTicks={verticalRulerTicks}
            />
          )}
          <div className="canvas-wrap" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
            <div
              className={showGrid ? 'page-canvas show-grid' : 'page-canvas'}
              onClick={() => setSelectedId('')}
              style={{
                width: `${documentState.page.size.width}${documentState.unit}`,
                height: `${documentState.page.size.height}${documentState.unit}`,
                backgroundColor: documentState.page.background,
              }}
            >
              {showBoxModel && (
                <>
                  {documentState.page.margin.top > 0 && (
                    <span className="margin-overlay top" style={{ height: `${documentState.page.margin.top}${documentState.unit}` }} />
                  )}
                  {documentState.page.margin.right > 0 && (
                    <span className="margin-overlay right" style={{ width: `${documentState.page.margin.right}${documentState.unit}` }} />
                  )}
                  {documentState.page.margin.bottom > 0 && (
                    <span className="margin-overlay bottom" style={{ height: `${documentState.page.margin.bottom}${documentState.unit}` }} />
                  )}
                  {documentState.page.margin.left > 0 && (
                    <span className="margin-overlay left" style={{ width: `${documentState.page.margin.left}${documentState.unit}` }} />
                  )}
                </>
              )}
              {documentState.objects.map((object) => (
                <EditorCanvasObject
                  draggingId={draggingId}
                  key={object.id}
                  object={object}
                  objectDragRef={objectDragRef}
                  onSelect={setSelectedId}
                  onStartDragging={setDraggingId}
                  selectedId={selectedId}
                  showBoxModel={showBoxModel}
                  unit={documentState.unit}
                />
              ))}
            </div>
          </div>
        </section>

        <SidePanel className="object-inspector">
          <AccordionPanel
            id="object"
            icon={<SlidersHorizontal size={16} />}
            onToggle={togglePanel}
            openPanels={openPanels}
            title="Objeto"
            titleMeta={selectedObject ? <span className="type-chip">{selectedObject.type}</span> : undefined}
          >
            {selectedObject ? (
              <div className="control-grid two">
                {(['x', 'y', 'width', 'height'] as const).map((key) => (
                  <NumberField
                    key={key}
                    label={key === 'width' ? 'W' : key === 'height' ? 'H' : key.toUpperCase()}
                    onChange={(event) => updateSelectedFrame(key, event.target.value)}
                    value={selectedObject.frame[key]}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-state">Selecione um objeto no canvas.</p>
            )}
          </AccordionPanel>

          {selectedObject && (
            <>
              {selectedObject.type === 'text' && (
                <AccordionPanel id="text" icon={<TypeIcon size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Texto">
                  <div className="codemirror-box text-editor-wrap">
                    <CodeMirror
                      basicSetup={{
                        foldGutter: false,
                        highlightActiveLine: true,
                        lineNumbers: false,
                      }}
                      extensions={templateEditorExtensions}
                      height="112px"
                      onChange={(value) => updateSelectedObjectContent(selectedObject.id, value)}
                      value={selectedObject.content ?? ''}
                    />
                  </div>
                </AccordionPanel>
              )}

              <AccordionPanel id="style" icon={<Palette size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Style">
                <div className="style-row">
                  <span>Fill</span>
                  <input
                    onChange={(event) => updateSelectedStyle('background', event.target.value)}
                    type="color"
                    value={selectedObject.style.background ?? '#ffffff'}
                  />
                  <input
                    onChange={(event) => updateSelectedStyle('background', event.target.value)}
                    placeholder="transparent"
                    type="text"
                    value={selectedObject.style.background ?? ''}
                  />
                </div>

                <div className="style-row">
                  <span>Text</span>
                  <input
                    onChange={(event) => updateSelectedStyle('color', event.target.value)}
                    type="color"
                    value={selectedObject.style.color ?? '#101828'}
                  />
                  <input
                    onChange={(event) => updateSelectedStyle('color', event.target.value)}
                    placeholder="#101828"
                    type="text"
                    value={selectedObject.style.color ?? ''}
                  />
                </div>

                <BorderControl value={selectedObject.style.border} onChange={(value) => updateSelectedStyle('border', value)} />

                <div className="control-grid two">
                  <NumberField
                    label="Radius"
                    min="0"
                    onChange={(event) => updateSelectedStyle('borderRadius', setNullableNumber(event.target.value))}
                    value={selectedObject.style.borderRadius ?? ''}
                  />
                  <NumberField
                    label="Padding"
                    min="0"
                    onChange={(event) => updateSelectedStyle('padding', setNullableNumber(event.target.value))}
                    value={selectedObject.style.padding ?? ''}
                  />
                </div>

                <div className="control-grid two">
                  <NumberField
                    label="Font"
                    min="1"
                    onChange={(event) => updateSelectedStyle('fontSize', setNullableNumber(event.target.value))}
                    value={selectedObject.style.fontSize ?? ''}
                  />
                  <NumberField
                    label="Weight"
                    max="900"
                    min="100"
                    onChange={(event) => updateSelectedStyle('fontWeight', setNullableNumber(event.target.value))}
                    step="100"
                    value={selectedObject.style.fontWeight ?? ''}
                  />
                </div>

                <SelectField
                  label="Text align"
                  onChange={(event) => updateSelectedStyle('textAlign', event.target.value as ObjectStyle['textAlign'])}
                  stacked
                  value={selectedObject.style.textAlign ?? 'left'}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </SelectField>

                {(selectedObject.type === 'container' || selectedObject.type === 'group') && (
                  <>
                    <SelectField
                      label="Display"
                      onChange={(event) => updateSelectedStyle('display', event.target.value as ObjectStyle['display'])}
                      stacked
                      value={selectedObject.style.display ?? 'block'}
                    >
                      <option value="block">Block</option>
                      <option value="flex">Flex</option>
                    </SelectField>

                    <div className="control-grid two">
                      <SelectField
                        label="Dir"
                        onChange={(event) => updateSelectedStyle('flexDirection', event.target.value as ObjectStyle['flexDirection'])}
                        value={selectedObject.style.flexDirection ?? 'row'}
                      >
                        <option value="row">Row</option>
                        <option value="column">Column</option>
                      </SelectField>
                      <NumberField
                        label="Gap"
                        min="0"
                        onChange={(event) => updateSelectedStyle('gap', setNullableNumber(event.target.value))}
                        value={selectedObject.style.gap ?? ''}
                      />
                    </div>
                  </>
                )}
              </AccordionPanel>
            </>
          )}
        </SidePanel>
      </main>
    </>
  );
}
