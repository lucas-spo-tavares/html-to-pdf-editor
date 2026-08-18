import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLanguage } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import { Copy } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import { generateTemplateHtml } from '@/editor/document/htmlGenerator';
import type { EditorDocument } from '@/editor/document/types';
import { formatHtml } from '@/editor/template-language/formatHtml';

type CodeViewProps = {
  documentState: EditorDocument;
};

export function CodeView({ documentState }: CodeViewProps) {
  const [formattedCode, setFormattedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const templateHtml = useMemo(() => generateTemplateHtml(documentState), [documentState]);

  useEffect(() => {
    void formatHtml(templateHtml).then(setFormattedCode);
  }, [templateHtml]);

  const copyCodeToClipboard = async () => {
    const code = formattedCode || templateHtml;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1400);
    } catch {
      setCopiedCode(false);
    }
  };

  return (
    <main className="workspace code">
      <section className="stage code">
        <div className="code-frame">
          <div className="code-actions code-actions-top">
            <Button className={copiedCode ? 'copied' : undefined} color={copiedCode ? 'success' : 'dark'} onClick={copyCodeToClipboard} variant="copy">
              <Copy size={16} />
              {copiedCode ? 'Copiado' : 'Copiar HTML'}
            </Button>
          </div>
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
          <div className="code-actions code-actions-bottom">
            <Button className={copiedCode ? 'copied' : undefined} color={copiedCode ? 'success' : 'dark'} onClick={copyCodeToClipboard} variant="copy">
              <Copy size={16} />
              {copiedCode ? 'Copiado' : 'Copiar HTML'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
