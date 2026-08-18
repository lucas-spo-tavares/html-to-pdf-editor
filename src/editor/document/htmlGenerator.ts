import type { EditorDocument, EditorObject, ObjectStyle, Unit } from '@/editor/document/types';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const unitValue = (value: number, unit: Unit) => `${value}${unit}`;

const styleToCss = (style: ObjectStyle, unit: Unit) => {
  const rules: string[] = [];

  const push = (property: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '') {
      rules.push(`${property}: ${value};`);
    }
  };

  push('background', style.background);
  push('color', style.color);
  push('border', style.border);
  push('border-radius', style.borderRadius === undefined ? undefined : unitValue(style.borderRadius, unit));
  push('opacity', style.opacity);
  push('padding', style.padding === undefined ? undefined : unitValue(style.padding, unit));
  push('display', style.display);
  push('flex-direction', style.flexDirection);
  push('align-items', style.alignItems);
  push('justify-content', style.justifyContent);
  push('gap', style.gap === undefined ? undefined : unitValue(style.gap, unit));
  push('font-family', style.fontFamily);
  push('font-size', style.fontSize === undefined ? undefined : `${style.fontSize}pt`);
  push('font-weight', style.fontWeight);
  push('font-style', style.fontStyle);
  push('text-decoration', style.textDecoration);
  push('line-height', style.lineHeight);
  push('text-align', style.textAlign);
  push('background-image', style.backgroundImage ? `url("${style.backgroundImage}")` : undefined);
  push('background-size', style.backgroundSize);
  push('background-position', style.backgroundPosition);
  push('background-repeat', style.backgroundImage ? 'no-repeat' : undefined);

  return rules.join(' ');
};

const renderObject = (object: EditorObject, unit: Unit, absolute = true): string => {
  const frameCss = absolute
    ? [
        'position: absolute;',
        `left: ${unitValue(object.frame.x, unit)};`,
        `top: ${unitValue(object.frame.y, unit)};`,
        `width: ${unitValue(object.frame.width, unit)};`,
        `height: ${unitValue(object.frame.height, unit)};`,
      ].join(' ')
    : [`width: ${unitValue(object.frame.width, unit)};`, `min-height: ${unitValue(object.frame.height, unit)};`].join(' ');

  const className = `editor-object editor-object-${object.type}`;
  const css = `${frameCss} ${styleToCss(object.style, unit)}`.trim();
  const children = object.children?.map((child) => renderObject(child, unit, object.style.display !== 'flex')).join('\n') ?? '';
  const content = object.type === 'text' ? escapeHtml(object.content ?? '') : children;

  let html = `<div class="${className}" data-object-id="${object.id}" style="${css}">${content}</div>`;

  if (object.template?.if) {
    html = `{% if ${object.template.if} %}\n${html}\n{% endif %}`;
  }

  if (object.template?.forEach) {
    html = `{% for ${object.template.forEach.item} in ${object.template.forEach.collection} %}\n${html}\n{% endfor %}`;
  }

  return html;
};

export const generateTemplateHtml = (document: EditorDocument) => {
  const { unit } = document;
  const page = document.page.size;
  const objects = document.objects.map((object) => renderObject(object, unit)).join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(document.title)}</title>
<style>
  html,
  body {
    margin: 0;
    padding: 0;
    background: #f2f4f7;
    font-family: Inter, Arial, sans-serif;
  }

  .pdf-page {
    position: relative;
    width: ${unitValue(page.width, unit)};
    height: ${unitValue(page.height, unit)};
    overflow: hidden;
    background: ${document.page.background};
  }

  .editor-object {
    box-sizing: border-box;
  }

  @media print {
    html,
    body {
      background: white;
    }

    .pdf-page {
      break-after: page;
      box-shadow: none;
    }
  }

  @page {
    size: ${unitValue(page.width, unit)} ${unitValue(page.height, unit)};
    margin: 0;
  }
</style>
</head>
<body>
<main class="pdf-page">
${objects}
</main>
</body>
</html>`;
};
