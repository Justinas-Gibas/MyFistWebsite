/**
 * 🧠 TypeInferenceEngine - AI-powered type inference for JavaScript
 */

class TypeInferenceEngine {
  constructor() {
    this.typePatterns = {
      string: [/name/i, /title/i, /description/i, /text/i, /message/i],
      number: [/age/i, /count/i, /size/i, /length/i, /index/i, /id$/i],
      array: [/list/i, /items/i, /numbers/i, /values/i],
      object: [/user/i, /config/i, /options/i, /data/i],
      boolean: [/is/i, /has/i, /should/i, /can/i, /enabled/i]
    };
  }

  inferParameterTypes(func) {
    const funcString = func.toString();
    const params = this._extractParameters(funcString);
    
    return params.map(param => this._inferTypeFromContext(param, funcString));
  }

  inferReturnType(func) {
    const funcString = func.toString();
    
    // Analyze return statements
    const returnMatches = funcString.match(/return\s+([^;}\n]+)/g) || [];
    const returnTypes = new Set();
    
    returnMatches.forEach(returnStmt => {
      const type = this._analyzeReturnStatement(returnStmt);
      if (type) returnTypes.add(type);
    });
    
    // If no explicit returns, might be void or implicit return
    if (returnTypes.size === 0) {
      if (funcString.includes('throw')) {
        returnTypes.add('throws');
      } else {
        returnTypes.add('undefined');
      }
    }
    
    return Array.from(returnTypes);
  }

  _extractParameters(funcString) {
    const paramMatch = funcString.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim().split('=')[0].trim())
      .filter(Boolean);
  }

  _inferTypeFromContext(paramName, funcString) {
    const types = [];
    
    // Pattern-based inference
    for (const [type, patterns] of Object.entries(this.typePatterns)) {
      if (patterns.some(pattern => pattern.test(paramName))) {
        types.push(type);
      }
    }
    
    // Context analysis
    const contextTypes = this._analyzeParameterUsage(paramName, funcString);
    types.push(...contextTypes);
    
    // Default fallback
    if (types.length === 0) {
      types.push('string', 'number'); // Most common types
    }
    
    return [...new Set(types)]; // Remove duplicates
  }

  _analyzeParameterUsage(paramName, funcString) {
    const types = [];
    
    // String operations
    if (new RegExp(`${paramName}\\.(trim|toLowerCase|toUpperCase|split|replace|match|includes)`).test(funcString)) {
      types.push('string');
    }
    
    // Array operations
    if (new RegExp(`${paramName}\\.(length|push|pop|slice|map|filter|reduce|forEach|every|some)`).test(funcString)) {
      types.push('array');
    }
    
    // Number operations
    if (new RegExp(`${paramName}\\s*[+\\-*/]|Math\\.|parseInt\\(${paramName}|parseFloat\\(${paramName}`).test(funcString)) {
      types.push('number');
    }
    
    // Object operations
    if (new RegExp(`${paramName}\\.|Object\\.keys\\(${paramName}|Object\\.values\\(${paramName}`).test(funcString)) {
      types.push('object');
    }
    
    // Type checks in the code
    if (new RegExp(`typeof\\s+${paramName}\\s*===\\s*['"]string['"]`).test(funcString)) {
      types.push('string');
    }
    if (new RegExp(`typeof\\s+${paramName}\\s*===\\s*['"]number['"]`).test(funcString)) {
      types.push('number');
    }
    if (new RegExp(`Array\\.isArray\\(${paramName}\\)`).test(funcString)) {
      types.push('array');
    }
    
    return types;
  }

  _analyzeReturnStatement(returnStmt) {
    const value = returnStmt.replace('return', '').trim();
    
    // Literal analysis
    if (/^['"`]/.test(value)) return 'string';
    if (/^\d+(\.\d+)?$/.test(value)) return 'number';
    if (/^(true|false)$/.test(value)) return 'boolean';
    if (/^\[.*\]$/.test(value)) return 'array';
    if (/^\{.*\}$/.test(value)) return 'object';
    if (value === 'null') return 'null';
    if (value === 'undefined') return 'undefined';
    
    // Template literal
    if (value.includes('${') || value.startsWith('`')) return 'string';
    
    // Function calls that typically return specific types
    if (value.includes('.map(') || value.includes('.filter(')) return 'array';
    if (value.includes('.toString()') || value.includes('.trim()')) return 'string';
    if (value.includes('.length') && !value.includes('.length()')) return 'number';
    
    return 'unknown';
  }
}
