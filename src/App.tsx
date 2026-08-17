import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import { html as htmlLanguage } from '@codemirror/lang-html';
import { json as jsonLanguage } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import {
  Box,
  Braces,
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  Eye,
  FileText,
  Grid3X3,
  Layers,
  LocateFixed,
  MousePointer2,
  Palette,
  Plus,
  Ruler,
  SlidersHorizontal,
  Type as TypeIcon,
  Minus,
} from 'lucide-react';
import type { EditorMode, EditorObject, Frame, ObjectStyle, PageSize } from './editor/document/types';
import { sampleDocument } from './editor/document/sampleDocument';
import { generateTemplateHtml } from './editor/document/htmlGenerator';
import { parseContext, getPathSuggestions } from './editor/template-language/context';
import { formatHtml } from './editor/template-language/formatHtml';
import { renderTemplate } from './editor/template-language/renderTemplate';

const modeItems: Array<{ id: EditorMode; label: string; icon: typeof MousePointer2 }> = [
  { id: 'edit', label: 'Edicao', icon: MousePointer2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'code', label: 'Codigo', icon: Code2 },
];

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

const flattenObjects = (objects: EditorObject[]): EditorObject[] =>
  objects.flatMap((object) => [object, ...flattenObjects(object.children ?? [])]);

const getTypingExpression = (value: string, caret: number) => {
  const beforeCaret = value.slice(0, caret);
  const openIndex = beforeCaret.lastIndexOf('{{');
  const closeIndex = beforeCaret.lastIndexOf('}}');

  if (openIndex === -1 || closeIndex > openIndex) {
    return undefined;
  }

  const expressionStart = openIndex + 2;
  const rawExpression = value.slice(expressionStart, caret);
  const leadingWhitespace = rawExpression.match(/^\s*/)?.[0].length ?? 0;
  const expression = rawExpression.slice(leadingWhitespace);

  if (!/^[a-zA-Z0-9_.]*$/.test(expression)) {
    return undefined;
  }

  return {
    path: expression,
    start: expressionStart + leadingWhitespace,
    end: caret,
  };
};

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

const toNumber = (value: string, fallback: number) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const setNullableNumber = (value: string) => {
  if (value.trim() === '') return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
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

const getTextTitle = (object: EditorObject) => {
  if (object.type !== 'text') return undefined;

  const content = (object.content ?? '').replace(/\s+/g, ' ').trim();
  if (!content) return undefined;

  return content.length > 80 ? `${content.slice(0, 77)}...` : content;
};

type AccordionPanelProps = {
  id: string;
  title: string;
  icon?: ReactNode;
  titleMeta?: ReactNode;
  openPanels: Set<string>;
  onToggle: (id: string) => void;
  children: ReactNode;
};

const AccordionPanel = ({ id, title, icon, titleMeta, openPanels, onToggle, children }: AccordionPanelProps) => {
  const open = openPanels.has(id);

  return (
    <section className={open ? 'panel accordion-panel open' : 'panel accordion-panel'}>
      <button
        aria-expanded={open}
        className="accordion-trigger"
        onClick={() => onToggle(id)}
        type="button"
      >
        <span className="accordion-title">
          {icon}
          <span>{title}</span>
          {titleMeta}
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </section>
  );
};

const objectStyle = (object: EditorObject, unit: string, selected: boolean) => ({
  left: `${object.frame.x}${unit}`,
  top: `${object.frame.y}${unit}`,
  width: `${object.frame.width}${unit}`,
  height: `${object.frame.height}${unit}`,
  background: object.style.background,
  color: object.style.color,
  border: selected ? '1.5px solid #1570ef' : object.style.border,
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

function App() {
  const [documentState, setDocumentState] = useState(sampleDocument);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedId, setSelectedId] = useState('title');
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showBoxModel, setShowBoxModel] = useState(false);
  const [viewport, setViewport] = useState({ x: 260, y: 140, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<string>>(
    () => new Set(['context', 'tree', 'object', 'text', 'style']),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['page-1', ...flattenObjects(sampleDocument.objects).map((object) => object.id)]),
  );
  const [lastValidContext, setLastValidContext] = useState<Record<string, unknown>>(() => JSON.parse(sampleDocument.contextText));
  const [contextError, setContextError] = useState<string>();
  const [formattedCode, setFormattedCode] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ pointerId: 0, x: 0, y: 0, viewportX: 0, viewportY: 0 });

  useEffect(() => {
    const next = parseContext(documentState.contextText, lastValidContext);
    setContextError(next.error);

    if (!next.error) {
      setLastValidContext(next.parsed);
    }
    // The fallback should remain the last valid context while the user edits invalid JSON.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentState.contextText]);

  const templateHtml = useMemo(() => generateTemplateHtml(documentState), [documentState]);
  const rendered = useMemo(() => renderTemplate(templateHtml, lastValidContext), [templateHtml, lastValidContext]);
  const allObjects = useMemo(() => flattenObjects(documentState.objects), [documentState.objects]);
  const selectedObject = useMemo(
    () => allObjects.find((object) => object.id === selectedId),
    [allObjects, selectedId],
  );

  useEffect(() => {
    if (mode === 'code') {
      void formatHtml(templateHtml).then(setFormattedCode);
    }
  }, [mode, templateHtml]);

  const templateAutocomplete = useMemo(
    () =>
      autocompletion({
        override: [
          (context: CompletionContext) => {
            const expression = getTypingExpression(context.state.doc.toString(), context.pos);
            if (!expression) return null;

            const path = expression.path;
            const options = path.includes('.')
              ? getPathSuggestions(lastValidContext, path.slice(0, path.lastIndexOf('.')))
                  .filter((key) => key.startsWith(path.slice(path.lastIndexOf('.') + 1)))
                  .map((key) => ({ label: key, type: 'property' }))
              : Object.keys(lastValidContext)
                  .filter((key) => key.startsWith(path))
                  .map((key) => ({ label: key, type: 'variable' }));

            if (options.length === 0) return null;

            return {
              from: expression.path.includes('.') ? expression.start + expression.path.lastIndexOf('.') + 1 : expression.start,
              options,
            };
          },
        ],
      }),
    [lastValidContext],
  );

  const handlePrint = () => {
    if (rendered.error) return;

    const iframe = globalThis.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'PDF print frame');
    globalThis.document.body.appendChild(iframe);

    const target = iframe.contentDocument;
    if (!target) {
      iframe.remove();
      return;
    }

    target.open();
    target.write(rendered.html);
    target.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => iframe.remove(), 500);
    };
  };

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

  const updatePageSize = (key: 'width' | 'height', value: string) => {
    setDocumentState((current) => ({
      ...current,
      page: {
        ...current.page,
        size: {
          ...current.page.size,
          name: 'Custom',
          [key]: toNumber(value, current.page.size[key]),
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
          [key]: toNumber(value, current.page.margin[key]),
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
          [key]: toNumber(value, object.frame[key]),
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

  const getTreeIcon = (object: EditorObject) => {
    if (object.type === 'text') return <TypeIcon size={14} />;
    if (object.type === 'group') return <Layers size={14} />;
    return <Box size={14} />;
  };

  const renderCanvasObject = (object: EditorObject, nested = false) => {
    const selected = selectedId === object.id;
    const selectObject = () => setSelectedId(object.id);
    const padding = object.style.padding ?? 0;
    const content =
      object.type === 'text' ? (
        <span>{object.content ?? ''}</span>
      ) : (
        object.children?.map((child) => renderCanvasObject(child, object.style.display === 'flex'))
      );

    return (
      <div
        className={nested ? 'canvas-child-object' : 'canvas-object'}
        key={object.id}
        onClick={(event) => {
          event.stopPropagation();
          selectObject();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            selectObject();
          }
        }}
        role="button"
        style={nested ? objectStyle(object, documentState.unit, selected) : objectStyle(object, documentState.unit, selected)}
        tabIndex={0}
      >
        {showBoxModel && padding > 0 && (
          <span
            className="padding-overlay"
            style={{
              backgroundImage: `
                linear-gradient(to bottom, rgb(111 207 151 / 35%) 0 ${padding}${documentState.unit}, transparent ${padding}${documentState.unit}),
                linear-gradient(to top, rgb(111 207 151 / 35%) 0 ${padding}${documentState.unit}, transparent ${padding}${documentState.unit}),
                linear-gradient(to right, rgb(111 207 151 / 35%) 0 ${padding}${documentState.unit}, transparent ${padding}${documentState.unit}),
                linear-gradient(to left, rgb(111 207 151 / 35%) 0 ${padding}${documentState.unit}, transparent ${padding}${documentState.unit})
              `,
            }}
          />
        )}
        {content}
        {selected && <span className="selection-label">{object.type}</span>}
      </div>
    );
  };

  const renderTreeObject = (object: EditorObject, depth = 0) => {
    const hasChildren = Boolean(object.children?.length);
    const expanded = expandedIds.has(object.id);

    return (
      <li className="tree-item" key={object.id}>
        <div className={selectedId === object.id ? 'tree-row active' : 'tree-row'} style={{ paddingLeft: 8 + depth * 14 }}>
          {hasChildren ? (
            <button
              aria-label={expanded ? 'Recolher objeto' : 'Expandir objeto'}
              className="tree-toggle"
              onClick={() => toggleTreeItem(object.id)}
              type="button"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-spacer" />
          )}
          <button className="tree-select" onClick={() => setSelectedId(object.id)} title={getTextTitle(object)} type="button">
            {getTreeIcon(object)}
            <span>{object.type}</span>
          </button>
        </div>
        {hasChildren && expanded && <ul className="tree-list">{object.children?.map((child) => renderTreeObject(child, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div className="app-shell">
      <div className="canvas-toggles" aria-label="Canvas toggles">
        <button className={showRulers ? 'icon-button active' : 'icon-button'} onClick={() => setShowRulers((value) => !value)} title="Alternar regua" type="button">
          <Ruler size={17} />
        </button>
        <button className={showGrid ? 'icon-button active' : 'icon-button'} onClick={() => setShowGrid((value) => !value)} title="Alternar grade" type="button">
          <Grid3X3 size={17} />
        </button>
      </div>

      <div className="canvas-box-toggle" aria-label="Box model toggles">
        <button
          className={showBoxModel ? 'box-model-button active' : 'box-model-button'}
          onClick={() => setShowBoxModel((value) => !value)}
          title="Mostrar margens e paddings"
          type="button"
        >
          <span className="box-swatch margin" />
          <span className="box-swatch padding" />
          Box model
        </button>
      </div>

      <div className="floating-mode-tabs" role="tablist" aria-label="Editor mode">
        {modeItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              aria-selected={mode === item.id}
              className={mode === item.id ? 'mode-tab active' : 'mode-tab'}
              key={item.id}
              onClick={() => setMode(item.id)}
              role="tab"
              type="button"
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <button className="floating-export primary-button" onClick={handlePrint} type="button">
        <Download size={16} />
        Exportar PDF
      </button>

      <div className="canvas-zoom" aria-label="Canvas zoom controls">
        <button className="icon-button" onClick={() => setZoom(viewport.zoom - 0.1)} title="Diminuir zoom" type="button">
          <Minus size={17} />
        </button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <button className="icon-button" onClick={() => setZoom(viewport.zoom + 0.1)} title="Aumentar zoom" type="button">
          <Plus size={17} />
        </button>
        <button className="icon-button" onClick={centerCanvas} title="Centralizar canvas" type="button">
          <LocateFixed size={17} />
        </button>
      </div>

      <main className="workspace">
        <aside className="page-inspector">
          <AccordionPanel id="page" icon={<FileText size={16} />} onToggle={togglePanel} openPanels={openPanels} title="Page">
            <label className="control-field stacked">
              <span>Preset</span>
              <select
                onChange={(event) => applyPagePreset(event.target.value as PageSize['name'])}
                value={documentState.page.size.name}
              >
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
                <option value="Custom">Custom</option>
              </select>
            </label>

            <label className="control-field stacked">
              <span>Orientation</span>
              <select
                onChange={(event) => updatePageOrientation(event.target.value as typeof documentState.page.orientation)}
                value={documentState.page.orientation}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>

            <div className="control-grid two">
              <label className="control-field">
                <span>W</span>
                <input
                  min="1"
                  onChange={(event) => updatePageSize('width', event.target.value)}
                  type="number"
                  value={documentState.page.size.width}
                />
              </label>
              <label className="control-field">
                <span>H</span>
                <input
                  min="1"
                  onChange={(event) => updatePageSize('height', event.target.value)}
                  type="number"
                  value={documentState.page.size.height}
                />
              </label>
            </div>

            <div className="control-grid two">
              <label className="control-field">
                <span>Unit</span>
                <select
                  onChange={(event) =>
                    setDocumentState((current) => ({
                      ...current,
                      unit: event.target.value as typeof current.unit,
                    }))
                  }
                  value={documentState.unit}
                >
                  <option value="mm">mm</option>
                  <option value="px">px</option>
                  <option value="in">in</option>
                </select>
              </label>
              <label className="control-field color-field">
                <span>Fill</span>
                <input
                  onChange={(event) => updatePageBackground(event.target.value)}
                  type="color"
                  value={documentState.page.background}
                />
              </label>
            </div>

            <div className="margin-editor">
              <span>Margins</span>
              <div className="control-grid two">
                {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
                  <label className="control-field" key={key}>
                    <span>{key.slice(0, 1).toUpperCase()}</span>
                    <input
                      min="0"
                      onChange={(event) => updatePageMargin(key, event.target.value)}
                      type="number"
                      value={documentState.page.margin[key]}
                    />
                  </label>
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
                extensions={[jsonLanguage(), EditorView.lineWrapping]}
                height="250px"
                onChange={(value) => setDocumentState((current) => ({ ...current, contextText: value }))}
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
                <button
                  aria-label={expandedIds.has('page-1') ? 'Recolher pagina' : 'Expandir pagina'}
                  className="tree-toggle"
                  onClick={() => toggleTreeItem('page-1')}
                  type="button"
                >
                  {expandedIds.has('page-1') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <button className="tree-select" onClick={() => setSelectedId('')} type="button">
                  <FileText size={14} />
                  <span>{documentState.page.size.name} page</span>
                  <em>
                    {documentState.page.size.width}x{documentState.page.size.height}
                    {documentState.unit}
                  </em>
                </button>
              </div>
              {expandedIds.has('page-1') && <ul className="tree-list">{documentState.objects.map((object) => renderTreeObject(object))}</ul>}
            </nav>
          </AccordionPanel>
        </aside>

        <section
          className={isPanning ? 'stage panning' : 'stage'}
          onPointerCancel={stopPanning}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={stopPanning}
        >
          {mode === 'edit' && (
            <div
              className="canvas-wrap"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              }}
            >
              {showRulers && (
                <>
                  <div className="ruler horizontal">0&nbsp;&nbsp;&nbsp;&nbsp;50&nbsp;&nbsp;&nbsp;&nbsp;100&nbsp;&nbsp;&nbsp;&nbsp;150&nbsp;&nbsp;&nbsp;&nbsp;210 mm</div>
                  <div className="ruler vertical">0 50 100 150 200 250 297 mm</div>
                </>
              )}
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
                      <span
                        className="margin-overlay top"
                        style={{ height: `${documentState.page.margin.top}${documentState.unit}` }}
                      />
                    )}
                    {documentState.page.margin.right > 0 && (
                      <span
                        className="margin-overlay right"
                        style={{ width: `${documentState.page.margin.right}${documentState.unit}` }}
                      />
                    )}
                    {documentState.page.margin.bottom > 0 && (
                      <span
                        className="margin-overlay bottom"
                        style={{ height: `${documentState.page.margin.bottom}${documentState.unit}` }}
                      />
                    )}
                    {documentState.page.margin.left > 0 && (
                      <span
                        className="margin-overlay left"
                        style={{ width: `${documentState.page.margin.left}${documentState.unit}` }}
                      />
                    )}
                  </>
                )}
                {documentState.objects.map((object) => renderCanvasObject(object))}
              </div>
            </div>
          )}

          {mode === 'preview' && (
            <div className="preview-frame" id="print-root" ref={printRef}>
              {rendered.error ? (
                <div className="render-error">{rendered.error}</div>
              ) : (
                <iframe className="preview-iframe" srcDoc={rendered.html} title="Rendered preview" />
              )}
            </div>
          )}

          {mode === 'code' && (
            <div className="code-view">
              <CodeMirror
                basicSetup={{
                  foldGutter: true,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                  lineNumbers: true,
                }}
                editable={false}
                extensions={[htmlLanguage(), EditorView.lineWrapping]}
                height="100%"
                theme="dark"
                value={formattedCode || templateHtml}
              />
            </div>
          )}
        </section>

        <aside className="object-inspector">
          <AccordionPanel
            id="object"
            icon={<SlidersHorizontal size={16} />}
            onToggle={togglePanel}
            openPanels={openPanels}
            title="Objeto"
            titleMeta={selectedObject ? <span className="type-chip">{selectedObject.type}</span> : undefined}
          >
            {selectedObject ? (
              <>
                <div className="control-grid two">
                  {(['x', 'y', 'width', 'height'] as const).map((key) => (
                    <label className="control-field" key={key}>
                      <span>{key === 'width' ? 'W' : key === 'height' ? 'H' : key.toUpperCase()}</span>
                      <input
                        onChange={(event) => updateSelectedFrame(key, event.target.value)}
                        type="number"
                        value={selectedObject.frame[key]}
                      />
                    </label>
                  ))}
                </div>
              </>
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
                      extensions={[templateAutocomplete, EditorView.lineWrapping]}
                      height="112px"
                      onChange={(value) =>
                        setDocumentState((current) => ({
                          ...current,
                          objects: updateObjectContent(current.objects, selectedObject.id, value),
                        }))
                      }
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

                <div className="border-control">
                  <span>Border</span>
                  <input
                    min="0"
                    onChange={(event) => {
                      const border = parseBorder(selectedObject.style.border);
                      updateSelectedStyle('border', composeBorder({ ...border, width: event.target.value }));
                    }}
                    placeholder="0"
                    type="number"
                    value={parseBorder(selectedObject.style.border).width}
                  />
                  <select
                    onChange={(event) => {
                      const border = parseBorder(selectedObject.style.border);
                      updateSelectedStyle('border', composeBorder({ ...border, style: event.target.value }));
                    }}
                    value={parseBorder(selectedObject.style.border).style}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                  <input
                    onChange={(event) => {
                      const border = parseBorder(selectedObject.style.border);
                      updateSelectedStyle('border', composeBorder({ ...border, color: event.target.value }));
                    }}
                    type="color"
                    value={parseBorder(selectedObject.style.border).color.startsWith('#') ? parseBorder(selectedObject.style.border).color : '#d0d5dd'}
                  />
                </div>

                <div className="control-grid two">
                  <label className="control-field">
                    <span>Radius</span>
                    <input
                      min="0"
                      onChange={(event) => updateSelectedStyle('borderRadius', setNullableNumber(event.target.value))}
                      type="number"
                      value={selectedObject.style.borderRadius ?? ''}
                    />
                  </label>
                  <label className="control-field">
                    <span>Padding</span>
                    <input
                      min="0"
                      onChange={(event) => updateSelectedStyle('padding', setNullableNumber(event.target.value))}
                      type="number"
                      value={selectedObject.style.padding ?? ''}
                    />
                  </label>
                </div>

                <div className="control-grid two">
                  <label className="control-field">
                    <span>Font</span>
                    <input
                      min="1"
                      onChange={(event) => updateSelectedStyle('fontSize', setNullableNumber(event.target.value))}
                      type="number"
                      value={selectedObject.style.fontSize ?? ''}
                    />
                  </label>
                  <label className="control-field">
                    <span>Weight</span>
                    <input
                      max="900"
                      min="100"
                      onChange={(event) => updateSelectedStyle('fontWeight', setNullableNumber(event.target.value))}
                      step="100"
                      type="number"
                      value={selectedObject.style.fontWeight ?? ''}
                    />
                  </label>
                </div>

                <label className="control-field stacked">
                  <span>Text align</span>
                  <select
                    onChange={(event) => updateSelectedStyle('textAlign', event.target.value as ObjectStyle['textAlign'])}
                    value={selectedObject.style.textAlign ?? 'left'}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>

                {(selectedObject.type === 'container' || selectedObject.type === 'group') && (
                  <>
                    <label className="control-field stacked">
                      <span>Display</span>
                      <select
                        onChange={(event) => updateSelectedStyle('display', event.target.value as ObjectStyle['display'])}
                        value={selectedObject.style.display ?? 'block'}
                      >
                        <option value="block">Block</option>
                        <option value="flex">Flex</option>
                      </select>
                    </label>

                    <div className="control-grid two">
                      <label className="control-field">
                        <span>Dir</span>
                        <select
                          onChange={(event) =>
                            updateSelectedStyle('flexDirection', event.target.value as ObjectStyle['flexDirection'])
                          }
                          value={selectedObject.style.flexDirection ?? 'row'}
                        >
                          <option value="row">Row</option>
                          <option value="column">Column</option>
                        </select>
                      </label>
                      <label className="control-field">
                        <span>Gap</span>
                        <input
                          min="0"
                          onChange={(event) => updateSelectedStyle('gap', setNullableNumber(event.target.value))}
                          type="number"
                          value={selectedObject.style.gap ?? ''}
                        />
                      </label>
                    </div>
                  </>
                )}
              </AccordionPanel>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
