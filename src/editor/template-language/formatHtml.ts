import prettier from 'prettier/standalone';
import htmlParser from 'prettier/plugins/html';

export const formatHtml = async (html: string) => {
  try {
    return await prettier.format(html, {
      parser: 'html',
      plugins: [htmlParser],
      printWidth: 96,
    });
  } catch {
    return html;
  }
};
