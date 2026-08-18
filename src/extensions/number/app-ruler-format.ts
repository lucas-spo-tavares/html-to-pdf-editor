declare global {
  interface Number {
    /**
     * Formata o numero para exibicao compacta em uma regua.
     *
     * @returns Texto sem ruido decimal para zero, inteiros grandes ou ate duas casas decimais.
     */
    appRulerFormat(): string;
  }
}

Number.prototype.appRulerFormat = function appRulerFormat(): string {
  const value = this.valueOf();

  if (Math.abs(value) < 0.0001) return '0';
  if (Math.abs(value) >= 10) return String(Math.round(value));

  return Number(value.toFixed(2)).toString();
};

export {};
