import { useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json as jsonLanguage } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { Braces, FileText } from 'lucide-react';
import { Button } from '../../components/atoms/button/button';
import { NumberField } from '../../components/atoms/number-field/number-field';
import { StaticAccordionPanel } from '../../components/atoms/static-accordion-panel/static-accordion-panel';
import { SidePanel } from '../../components/organisms/side-panel/side-panel';
import type { EditorDocument } from '../../editor/document/types';

type RenderedTemplate = {
  html: string;
  error?: string;
};

type PreviewViewProps = {
  contextError?: string;
  documentState: EditorDocument;
  rendered: RenderedTemplate;
  onContextTextChange: (value: string) => void;
};

export function PreviewView({
  contextError,
  documentState,
  rendered,
  onContextTextChange,
}: PreviewViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <main className="workspace preview">
      <SidePanel className="page-inspector preview-context-panel">
        <StaticAccordionPanel icon={<Braces size={16} />} title="Contexto JSON">
          <div className="codemirror-box json-editor-wrap preview-json-editor">
            <CodeMirror
              basicSetup={{
                foldGutter: true,
                highlightActiveLine: true,
                lineNumbers: true,
              }}
              extensions={[jsonLanguage(), EditorView.lineWrapping]}
              height="calc(100vh - 112px)"
              onChange={onContextTextChange}
              value={documentState.contextText}
            />
          </div>
          <p className={contextError ? 'status error' : 'status ok'}>
            {contextError ? contextError : 'JSON valido'}
          </p>
        </StaticAccordionPanel>
      </SidePanel>

      <section className="stage preview">
        <div className="preview-frame" id="print-root" ref={printRef}>
          {rendered.error ? (
            <div className="render-error">{rendered.error}</div>
          ) : (
            <div className="preview-page-shell" dangerouslySetInnerHTML={{ __html: rendered.html }} />
          )}
        </div>
      </section>

      <SidePanel className="object-inspector preview-pages-panel">
        <StaticAccordionPanel icon={<FileText size={16} />} title="Pages">
          <NumberField label="Page" min="1" readOnly value={1} />
          <Button active onClick={() => printRef.current?.scrollIntoView({ block: 'center' })} variant="pageThumb">
            <span className="page-thumb-preview">
              {rendered.error ? <span className="page-thumb-error">!</span> : <iframe srcDoc={rendered.html} title="Page 1 thumbnail" />}
            </span>
            <span className="page-thumb-meta">
              <strong>Page 1</strong>
            </span>
          </Button>
        </StaticAccordionPanel>
      </SidePanel>
    </main>
  );
}
