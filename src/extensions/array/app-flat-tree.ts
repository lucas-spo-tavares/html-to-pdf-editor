declare global {
  interface Array<T> {
    /**
     * Achata uma lista de itens em arvore preservando a ordem de profundidade.
     *
     * @param getChildren - Funcao que retorna os filhos de cada item.
     * @returns Lista com cada item seguido por seus descendentes.
     */
    appFlatTree(getChildren: (item: T) => T[] | undefined): T[];
  }
}

Array.prototype.appFlatTree = function appFlatTree<T>(
  this: T[],
  getChildren: (item: T) => T[] | undefined,
): T[] {
  return this.flatMap((item) => [item, ...(getChildren(item)?.appFlatTree(getChildren) ?? [])]);
};

export {};
