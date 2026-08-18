declare global {
  interface Number {
    /**
     * Arredonda o numero para cima usando intervalos amigaveis de escala.
     *
     * @returns Proximo valor na sequencia 1, 2, 5 ou 10 multiplicada pela potencia decimal adequada.
     */
    appNiceCeil(): number;
  }
}

Number.prototype.appNiceCeil = function appNiceCeil(): number {
  const value = this.valueOf();
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return niceFraction * 10 ** exponent;
};

export {};
