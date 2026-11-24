// A small JSON Schema validator covering the subset used by site/catalog/_schema.json:
// type, enum, const, pattern, minLength, maxLength, minimum, maximum, items, minItems,
// maxItems, uniqueItems, required, properties, additionalProperties (boolean),
// allOf, anyOf, not, if/then/else and local $ref ("#/$defs/...").
// It returns a list of readable errors instead of throwing.

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function typeMatches(value, type) {
  const t = typeOf(value);
  if (type === 'number') return t === 'number' || t === 'integer';
  return t === type;
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Only local $ref is supported: ${ref}`);
  return ref.slice(2).split('/').reduce((node, key) => node?.[key], root);
}

export function validate(schema, value, root = schema, at = '') {
  const errors = [];
  const where = at || '(root)';
  if (schema === true) return errors;
  if (schema === false) return [`${where}: not allowed`];

  if (schema.$ref) return validate(resolveRef(root, schema.$ref), value, root, at);

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) {
      return [`${where}: expected ${types.join(' or ')}, got ${typeOf(value)}`];
    }
  }
  if ('const' in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errors.push(`${where}: must be ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push(`${where}: must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  }

  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${where}: shorter than ${schema.minLength}`);
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(`${where}: longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) errors.push(`${where}: "${value}" does not match ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${where}: below ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${where}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${where}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${where}: allows at most ${schema.maxItems} item(s)`);
    if (schema.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) errors.push(`${where}: items must be unique`);
    if (schema.items) value.forEach((item, i) => errors.push(...validate(schema.items, item, root, `${at}[${i}]`)));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${where}: missing "${key}"`);
    }
    const props = schema.properties ?? {};
    for (const [key, v] of Object.entries(value)) {
      const child = at ? `${at}.${key}` : key;
      if (key in props) errors.push(...validate(props[key], v, root, child));
      else if (schema.additionalProperties === false) errors.push(`${where}: unknown property "${key}"`);
      else if (typeof schema.additionalProperties === 'object') errors.push(...validate(schema.additionalProperties, v, root, child));
    }
  }

  for (const sub of schema.allOf ?? []) errors.push(...validate(sub, value, root, at));
  if (schema.anyOf && !schema.anyOf.some((sub) => validate(sub, value, root, at).length === 0)) {
    errors.push(`${where}: does not match any allowed shape`);
  }
  if (schema.not && validate(schema.not, value, root, at).length === 0) {
    errors.push(`${where}: matches a forbidden shape`);
  }
  if (schema.if) {
    const branch = validate(schema.if, value, root, at).length === 0 ? schema.then : schema.else;
    if (branch) errors.push(...validate(branch, value, root, at));
  }
  return errors;
}
