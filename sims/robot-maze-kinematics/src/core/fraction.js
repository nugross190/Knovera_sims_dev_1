// Exact rational numbers, so answers like 60/7 can be compared without
// floating-point error.

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export class Frac {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`Frac needs integers: ${n}/${d}`);
    if (d === 0) throw new Error('Frac denominator is zero');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1;
    this.n = n / g + 0; // + 0 turns -0 into 0
    this.d = d / g;
  }

  static of(x) {
    return x instanceof Frac ? x : new Frac(x, 1);
  }

  add(o) {
    o = Frac.of(o);
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  }

  sub(o) {
    o = Frac.of(o);
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }

  mul(o) {
    o = Frac.of(o);
    return new Frac(this.n * o.n, this.d * o.d);
  }

  div(o) {
    o = Frac.of(o);
    return new Frac(this.n * o.d, this.d * o.n);
  }

  neg() {
    return new Frac(-this.n, this.d);
  }

  abs() {
    return new Frac(Math.abs(this.n), this.d);
  }

  eq(o) {
    o = Frac.of(o);
    return this.n === o.n && this.d === o.d;
  }

  isInt() {
    return this.d === 1;
  }

  toNumber() {
    return this.n / this.d;
  }

  // Rounds to 1 decimal place, halves away from zero, exactly.
  round1() {
    const num = Math.abs(this.n) * 10;
    let q = Math.floor(num / this.d);
    if (2 * (num % this.d) >= this.d) q += 1;
    return new Frac(Math.sign(this.n) * q, 10);
  }

  // True when the decimal expansion ends (denominator has only 2s and 5s).
  isTerminating() {
    let d = this.d;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }

  toString() {
    return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
  }

  // Decimal text: exact when it terminates within `maxDp` places, else rounded.
  toDecimal(maxDp = 2) {
    const x = this.toNumber();
    if (this.isTerminating()) {
      const s = String(Number(x.toFixed(maxDp)));
      if (Math.abs(Number(s) - x) < 1e-12) return s;
    }
    return x.toFixed(maxDp);
  }
}
