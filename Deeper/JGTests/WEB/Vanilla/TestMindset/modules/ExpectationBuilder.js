/**
 * 💫 ExpectationBuilder - Fluent, expressive assertions
 */

class ExpectationBuilder {
  constructor(actual, suite) {
    this.actual = actual;
    this.suite = suite;
    this.negated = false;
  }

  get not() {
    this.negated = !this.negated;
    return this;
  }

  toBe(expected) {
    const passes = this.actual === expected;
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated 
        ? `Expected ${this.actual} not to be ${expected}`
        : `Expected ${this.actual} to be ${expected}`;
      throw new Error(message);
    }
    
    return this;
  }

  toEqual(expected) {
    const passes = this._deepEqual(this.actual, expected);
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected ${JSON.stringify(this.actual)} not to equal ${JSON.stringify(expected)}`
        : `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`;
      throw new Error(message);
    }
    
    return this;
  }

  toThrow(expectedMessage) {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected value must be a function when using toThrow');
    }
    
    let threw = false;
    let actualError = null;
    
    try {
      this.actual();
    } catch (err) {
      threw = true;
      actualError = err;
    }
    
    const passes = threw && (!expectedMessage || actualError.message.includes(expectedMessage));
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      if (this.negated) {
        throw new Error(`Expected function not to throw${expectedMessage ? ` error containing "${expectedMessage}"` : ''}`);
      } else {
        if (!threw) {
          throw new Error('Expected function to throw an error, but it didn\'t');
        } else {
          throw new Error(`Expected error message to contain "${expectedMessage}", but got "${actualError.message}"`);
        }
      }
    }
    
    return this;
  }

  toBeType(expectedType) {
    const actualType = Array.isArray(this.actual) ? 'array' : typeof this.actual;
    const passes = actualType === expectedType;
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected ${this.actual} not to be type ${expectedType}`
        : `Expected ${this.actual} to be type ${expectedType}, but got ${actualType}`;
      throw new Error(message);
    }
    
    return this;
  }

  toContain(expected) {
    let passes = false;
    
    if (Array.isArray(this.actual)) {
      passes = this.actual.includes(expected);
    } else if (typeof this.actual === 'string') {
      passes = this.actual.includes(expected);
    } else {
      throw new Error('toContain can only be used with arrays or strings');
    }
    
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected ${this.actual} not to contain ${expected}`
        : `Expected ${this.actual} to contain ${expected}`;
      throw new Error(message);
    }
    
    return this;
  }

  toHaveLength(expectedLength) {
    const actualLength = this.actual?.length;
    const passes = actualLength === expectedLength;
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected length not to be ${expectedLength}, but got ${actualLength}`
        : `Expected length to be ${expectedLength}, but got ${actualLength}`;
      throw new Error(message);
    }
    
    return this;
  }

  toBeGreaterThan(expected) {
    const passes = this.actual > expected;
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected ${this.actual} not to be greater than ${expected}`
        : `Expected ${this.actual} to be greater than ${expected}`;
      throw new Error(message);
    }
    
    return this;
  }

  toBeLessThan(expected) {
    const passes = this.actual < expected;
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected ${this.actual} not to be less than ${expected}`
        : `Expected ${this.actual} to be less than ${expected}`;
      throw new Error(message);
    }
    
    return this;
  }

  toMatch(pattern) {
    if (typeof this.actual !== 'string') {
      throw new Error('toMatch can only be used with strings');
    }
    
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const passes = regex.test(this.actual);
    const result = this.negated ? !passes : passes;
    
    if (!result) {
      const message = this.negated
        ? `Expected "${this.actual}" not to match ${pattern}`
        : `Expected "${this.actual}" to match ${pattern}`;
      throw new Error(message);
    }
    
    return this;
  }

  _deepEqual(a, b) {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this._deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this._deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}
