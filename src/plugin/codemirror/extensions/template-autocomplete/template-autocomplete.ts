import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import type { Extension } from '@codemirror/state';
import { getPathSuggestions } from '@/editor/template-language/context';

type TypingExpression = {
  path: string;
  start: number;
  end: number;
};

const getTypingExpression = (value: string, caret: number): TypingExpression | undefined => {
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

export const templateAutocomplete = (templateContext: Record<string, unknown>): Extension =>
  autocompletion({
    override: [
      (context: CompletionContext) => {
        const expression = getTypingExpression(context.state.doc.toString(), context.pos);
        if (!expression) return null;

        const path = expression.path;
        const options = path.includes('.')
          ? getPathSuggestions(templateContext, path.slice(0, path.lastIndexOf('.')))
              .filter((key) => key.startsWith(path.slice(path.lastIndexOf('.') + 1)))
              .map((key) => ({ label: key, type: 'property' }))
          : Object.keys(templateContext)
              .filter((key) => key.startsWith(path))
              .map((key) => ({ label: key, type: 'variable' }));

        if (options.length === 0) return null;

        return {
          from: expression.path.includes('.') ? expression.start + expression.path.lastIndexOf('.') + 1 : expression.start,
          options,
        };
      },
    ],
  });
