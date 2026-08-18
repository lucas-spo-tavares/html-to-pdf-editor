import { useEffect, useMemo, useState } from 'react';
import { Code2, Download, Eye, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/atoms/button/Button';
import type { EditorDocument, EditorMode } from '@/editor/document/types';
import { generateTemplateHtml } from '@/editor/document/htmlGenerator';
import { sampleDocument } from '@/editor/document/sampleDocument';
import { parseContext } from '@/editor/template-language/context';
import { renderTemplate } from '@/editor/template-language/renderTemplate';
import { CodeView } from '@/views/code/CodeView';
import { EditView } from '@/views/edit/EditView';
import { PreviewView } from '@/views/preview/PreviewView';

const modeItems: Array<{ id: EditorMode; label: string; icon: typeof MousePointer2 }> = [
  { id: 'edit', label: 'Edicao', icon: MousePointer2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'code', label: 'Codigo', icon: Code2 },
];

function App() {
  const [documentState, setDocumentState] = useState<EditorDocument>(sampleDocument);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [lastValidContext, setLastValidContext] = useState<Record<string, unknown>>(() => JSON.parse(sampleDocument.contextText));
  const [contextError, setContextError] = useState<string>();

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

  const updateContextText = (value: string) => {
    setDocumentState((current) => ({ ...current, contextText: value }));
  };

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

  return (
    <div className="app-shell">
      <div className="floating-mode-tabs" role="tablist" aria-label="Editor mode">
        {modeItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              aria-selected={mode === item.id}
              active={mode === item.id}
              key={item.id}
              onClick={() => setMode(item.id)}
              role="tab"
              variant="tab"
            >
              <Icon size={16} />
              {item.label}
            </Button>
          );
        })}
      </div>

      {mode !== 'code' && (
        <Button color="primary" floating="export" onClick={handlePrint}>
          <Download size={16} />
          Exportar PDF
        </Button>
      )}

      {mode === 'edit' && (
        <EditView
          contextError={contextError}
          documentState={documentState}
          lastValidContext={lastValidContext}
          onContextTextChange={updateContextText}
          setDocumentState={setDocumentState}
        />
      )}

      {mode === 'preview' && (
        <PreviewView
          contextError={contextError}
          documentState={documentState}
          onContextTextChange={updateContextText}
          rendered={rendered}
        />
      )}

      {mode === 'code' && <CodeView documentState={documentState} />}
    </div>
  );
}

export default App;
