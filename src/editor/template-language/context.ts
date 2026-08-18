export type ContextState = {
  parsed: Record<string, unknown>;
  error?: string;
};

export const parseContext = (text: string, fallback: Record<string, unknown>): ContextState => {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        parsed: fallback,
        error: 'O contexto precisa ser um objeto JSON.',
      };
    }

    return {
      parsed: parsed as Record<string, unknown>,
    };
  } catch (error) {
    return {
      parsed: fallback,
      error: error instanceof Error ? error.message : 'JSON invalido.',
    };
  }
};

export const getPathSuggestions = (context: Record<string, unknown>, path: string) => {
  const parts = path.split('.').filter(Boolean);
  let cursor: unknown = context;

  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
      return [];
    }

    cursor = (cursor as Record<string, unknown>)[part];
  }

  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
    return [];
  }

  return Object.keys(cursor as Record<string, unknown>);
};

export const getValueAtPath = (context: Record<string, unknown>, path: string): unknown => {
  const parts = path.split('.').filter(Boolean);
  let cursor: unknown = context;

  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[part];
  }

  return cursor;
};

export const getArrayPaths = (context: Record<string, unknown>) => {
  const paths: string[] = [];

  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      paths.push(path);
      return;
    }

    if (!value || typeof value !== 'object') return;

    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      visit(child, path ? `${path}.${key}` : key);
    });
  };

  visit(context, '');

  return paths;
};
