import nunjucks from 'nunjucks';

const env = new nunjucks.Environment(undefined, {
  autoescape: false,
  throwOnUndefined: false,
  trimBlocks: true,
  lstripBlocks: true,
});

export type RenderResult = {
  html: string;
  error?: string;
};

export const renderTemplate = (template: string, context: unknown): RenderResult => {
  try {
    return {
      html: env.renderString(template, context as object),
    };
  } catch (error) {
    return {
      html: '',
      error: error instanceof Error ? error.message : 'Template render failed.',
    };
  }
};
