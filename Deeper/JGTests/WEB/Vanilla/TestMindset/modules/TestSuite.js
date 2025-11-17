/**
 * 🧪 TestSuite - Minimal, powerful test execution engine
 */

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.hooks = {
      beforeEach: [],
      afterEach: [],
      beforeAll: [],
      afterAll: []
    };
  }

  test(description, testFn) {
    this.tests.push({
      description,
      fn: testFn,
      type: 'unit'
    });
  }

  propertyTest(description, generator, testFn, iterations = 100) {
    this.tests.push({
      description: `[Property] ${description}`,
      fn: () => this._runPropertyTest(generator, testFn, iterations),
      type: 'property'
    });
  }

  stressTest(description, iterations, testFn) {
    this.tests.push({
      description: `[Stress] ${description}`,
      fn: () => this._runStressTest(testFn, iterations),
      type: 'stress'
    });
  }

  beforeEach(fn) { this.hooks.beforeEach.push(fn); }
  afterEach(fn) { this.hooks.afterEach.push(fn); }
  beforeAll(fn) { this.hooks.beforeAll.push(fn); }
  afterAll(fn) { this.hooks.afterAll.push(fn); }

  async run() {
    const results = {
      suite: this.name,
      tests: [],
      passed: 0,
      failed: 0,
      total: this.tests.length,
      duration: 0
    };

    const startTime = performance.now();

    // Run beforeAll hooks
    await this._runHooks(this.hooks.beforeAll);

    for (const test of this.tests) {
      const testResult = await this._runSingleTest(test);
      results.tests.push(testResult);
      
      if (testResult.passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Run afterAll hooks
    await this._runHooks(this.hooks.afterAll);

    results.duration = performance.now() - startTime;
    return results;
  }

  async _runSingleTest(test) {
    const testStartTime = performance.now();
    let passed = false;
    let error = null;

    try {
      // Run beforeEach hooks
      await this._runHooks(this.hooks.beforeEach);
      
      // Run the actual test
      await test.fn();
      passed = true;
      
      console.log(`  ✅ ${test.description}`);
    } catch (err) {
      error = err.message;
      console.log(`  ❌ ${test.description}`);
      console.log(`     💥 ${err.message}`);
    } finally {
      // Run afterEach hooks
      await this._runHooks(this.hooks.afterEach);
    }

    return {
      description: test.description,
      type: test.type,
      passed,
      error,
      duration: performance.now() - testStartTime
    };
  }

  async _runHooks(hooks) {
    for (const hook of hooks) {
      await hook();
    }
  }

  _runPropertyTest(generator, testFn, iterations) {
    for (let i = 0; i < iterations; i++) {
      const input = generator();
      try {
        testFn(input);
      } catch (err) {
        throw new Error(`Property test failed on iteration ${i + 1} with input: ${JSON.stringify(input)}. ${err.message}`);
      }
    }
  }

  _runStressTest(testFn, iterations) {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      testFn();
    }
    
    const duration = performance.now() - startTime;
    const avgTime = duration / iterations;
    
    if (avgTime > 10) { // 10ms threshold
      throw new Error(`Stress test failed: Average execution time ${avgTime.toFixed(2)}ms exceeds threshold`);
    }
  }
}
