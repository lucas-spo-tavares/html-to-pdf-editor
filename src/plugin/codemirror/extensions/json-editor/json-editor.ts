import type { Extension } from '@codemirror/state';
import { json as jsonLanguage } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

export const jsonEditorExtensions = (): Extension[] => [jsonLanguage(), EditorView.lineWrapping];
