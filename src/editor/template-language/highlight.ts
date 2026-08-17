const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const highlightTemplateText = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped.replace(/(\{\{[\s\S]*?\}\})/g, '<mark class="template-token">$1</mark>');
};

export const highlightCode = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/(&lt;\/?[a-zA-Z][^&]*?&gt;)/g, '<span class="code-tag">$1</span>')
    .replace(/(\{\{[\s\S]*?\}\})/g, '<span class="code-var">$1</span>')
    .replace(/(\{%[\s\S]*?%\})/g, '<span class="code-block">$1</span>');
};

export const highlightJson = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
    (match, key, stringValue, literal, number) => {
      if (key) return `<span class="json-key">${key}</span>`;
      if (stringValue) return `<span class="json-string">${stringValue}</span>`;
      if (literal) return `<span class="json-literal">${literal}</span>`;
      if (number) return `<span class="json-number">${number}</span>`;
      return match;
    },
  );
};
