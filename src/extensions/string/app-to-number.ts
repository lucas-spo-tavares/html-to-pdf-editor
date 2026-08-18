declare global {
  interface String {
    /**
     * Converte a string em numero usando um fallback quando o resultado nao e finito.
     *
     * @param fallback - Valor retornado quando a string nao representa um numero finito.
     * @returns Numero convertido ou o fallback informado.
     */
    appToNumber(fallback: number): number;
  }
}

String.prototype.appToNumber = function appToNumber(fallback: number): number {
  const next = Number(this.valueOf());

  return Number.isFinite(next) ? next : fallback;
};

export {};
