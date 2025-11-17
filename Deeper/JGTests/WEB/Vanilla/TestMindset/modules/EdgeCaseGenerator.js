/**
 * 🎯 EdgeCaseGenerator - Intelligent edge case generation
 */

class EdgeCaseGenerator {
  constructor() {
    this.edgeCases = {
      string: ['', ' ', null, undefined, 123, [], {}, '\n\t\r'],
      number: [0, -1, 1, Infinity, -Infinity, NaN, '123', null, undefined],
      array: [[], null, undefined, 'not-array', [null], [undefined]],
      object: [{}, null, undefined, 'not-object', [], 123],
      boolean: [null, undefined, 0, 1, '', 'true', 'false']
    };
  }

  generate(signature) {
    const cases = [];
    const { paramTypes, parameters } = signature;

    // Generate null/undefined tests
    cases.push(...this._generateNullTests(parameters.length));
    
    // Generate type mismatch tests
    cases.push(...this._generateTypeMismatchTests(paramTypes, parameters.length));
    
    // Generate boundary value tests
    cases.push(...this._generateBoundaryTests(paramTypes, parameters.length));
    
    // Generate empty value tests
    cases.push(...this._generateEmptyValueTests(paramTypes, parameters.length));

    return cases;
  }

  _generateNullTests(paramCount) {
    const cases = [];
    
    for (let i = 0; i < paramCount; i++) {
      [null, undefined].forEach(nullValue => {
        const inputs = new Array(paramCount).fill('default');
        inputs[i] = nullValue;
        
        cases.push({
          description: `should handle ${nullValue} in parameter ${i + 1}`,
          inputs,
          shouldThrow: true,
          expectedError: nullValue === null ? 'null' : 'undefined'
        });
      });
    }
    
    return cases;
  }

  _generateTypeMismatchTests(paramTypes, paramCount) {
    const cases = [];
    
    paramTypes.forEach((expectedTypes, paramIndex) => {
      expectedTypes.forEach(expectedType => {
        const wrongTypes = this._getWrongTypesFor(expectedType);
        
        wrongTypes.forEach(wrongValue => {
          const inputs = new Array(paramCount).fill('default');
          inputs[paramIndex] = wrongValue;
          
          cases.push({
            description: `should reject ${typeof wrongValue} when expecting ${expectedType}`,
            inputs,
            shouldThrow: true,
            expectedError: `must be`
          });
        });
      });
    });
    
    return cases;
  }

  _generateBoundaryTests(paramTypes, paramCount) {
    const cases = [];
    
    paramTypes.forEach((types, paramIndex) => {
      if (types.includes('number')) {
        const boundaryValues = [
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_VALUE,
          Number.MIN_VALUE,
          0,
          -0,
          0.1,
          -0.1
        ];
        
        boundaryValues.forEach(value => {
          const inputs = new Array(paramCount).fill(1);
          inputs[paramIndex] = value;
          
          cases.push({
            description: `should handle boundary number ${value}`,
            inputs,
            shouldThrow: false,
            assertions: [result => this._assertValidResult(result)]
          });
        });
      }
      
      if (types.includes('string')) {
        const stringBoundaries = [
          '', // empty
          ' '.repeat(1000), // very long
          '🔥💯🚀', // unicode
          '\0\x01\x02' // control characters
        ];
        
        stringBoundaries.forEach(value => {
          const inputs = new Array(paramCount).fill('test');
          inputs[paramIndex] = value;
          
          cases.push({
            description: `should handle boundary string case`,
            inputs,
            shouldThrow: false,
            assertions: [result => this._assertValidResult(result)]
          });
        });
      }
    });
    
    return cases;
  }

  _generateEmptyValueTests(paramTypes, paramCount) {
    const cases = [];
    
    paramTypes.forEach((types, paramIndex) => {
      const emptyValues = {
        'array': [],
        'string': '',
        'object': {},
        'number': 0
      };
      
      types.forEach(type => {
        if (emptyValues[type] !== undefined) {
          const inputs = new Array(paramCount).fill('default');
          inputs[paramIndex] = emptyValues[type];
          
          cases.push({
            description: `should handle empty ${type}`,
            inputs,
            shouldThrow: false,
            assertions: [result => this._assertValidResult(result)]
          });
        }
      });
    });
    
    return cases;
  }

  _getWrongTypesFor(expectedType) {
    const wrongTypeMap = {
      'string': [123, [], {}, true, null],
      'number': ['123', [], {}, true, null],
      'array': ['array', 123, {}, true, null],
      'object': ['object', 123, [], true, null],
      'boolean': ['true', 123, [], {}, null]
    };
    
    return wrongTypeMap[expectedType] || [null, undefined];
  }

  _assertValidResult(result) {
    // Basic validation that result is not undefined unless expected
    if (result === undefined) {
      console.warn('Function returned undefined - verify this is expected');
    }
  }
}
