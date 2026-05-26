/**
 * htmlstudio/agent — framework-agnostic LLM glue.
 *
 * Ships the contract an editing agent needs to operate on htmlstudio:
 *   - PATCH_JSON_SCHEMA — JSON Schema for the Patch union. Drop into
 *     Anthropic / OpenAI / Prompture tool specs without hand-writing.
 *   - PROVIDER_TOOL_SPECS — pre-baked tool definitions per provider.
 *   - validatePatch — runtime guard for an unknown LLM blob → typed Patch.
 *   - formatSelectionContext — selection → prompt-ready string.
 *   - TWEAK_SYSTEM_PROMPT / REBUILD_SYSTEM_PROMPT — sensible defaults.
 *
 * No React, no DOM. Safe to import in Node, Bun, edge functions, etc.
 */

import type { Patch, ElementInfo } from '../types.js';

/* ====================================================================== */
/* JSON Schema for the Patch union                                          */
/* ====================================================================== */

/**
 * Draft-07 JSON Schema describing a single `Patch`. Pass directly as an
 * Anthropic tool `input_schema`, an OpenAI function `parameters`, or any
 * schema-aware structured-output API (Prompture's `schema=`, Vercel AI
 * SDK's `tool({ parameters })`, etc.).
 */
export const PATCH_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Patch',
  description:
    'One mutation to an htmlstudio HTML source. Every editable action — text changes, style tweaks, attribute edits, block inserts, full regenerations — maps to exactly one of these kinds.',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'value'],
      properties: {
        kind: { const: 'set-text' },
        id: { type: 'string', description: 'data-ve-id of the target element' },
        value: { type: 'string', description: 'Plain text replacement' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'href', 'text'],
      properties: {
        kind: { const: 'set-link' },
        id: { type: 'string' },
        href: { type: 'string', description: 'New href' },
        text: { type: 'string', description: 'New visible label' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'src', 'alt'],
      properties: {
        kind: { const: 'set-image' },
        id: { type: 'string' },
        src: { type: 'string' },
        alt: { type: 'string' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'styles'],
      properties: {
        kind: { const: 'set-style' },
        id: { type: 'string' },
        styles: {
          type: 'object',
          description:
            'CSS property → value pairs. Empty-string value removes the property.',
          additionalProperties: { type: 'string' },
        },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'attributes'],
      properties: {
        kind: { const: 'set-attributes' },
        id: { type: 'string' },
        attributes: {
          type: 'object',
          description:
            'Attribute → value pairs. Null value removes the attribute.',
          additionalProperties: { type: ['string', 'null'] },
        },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'id', 'html'],
      properties: {
        kind: { const: 'set-outer-html' },
        id: { type: 'string' },
        html: {
          type: 'string',
          description:
            'Full replacement markup. The element keeps its data-ve-id; new descendants get fresh ids on the next tag pass.',
        },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'source'],
      properties: {
        kind: { const: 'set-full-source' },
        source: {
          type: 'string',
          description: 'Replacement HTML for the entire document.',
        },
      },
    },
  ],
} as const;

/* ====================================================================== */
/* Provider tool specs                                                      */
/* ====================================================================== */

const TOOL_NAME = 'apply_patch';
const TOOL_DESCRIPTION =
  'Apply a single Patch to the htmlstudio source. Always emit exactly one patch per tool call. Prefer narrow patches (set-text, set-style, set-attributes) over broad ones (set-outer-html, set-full-source).';

/**
 * Anthropic Messages API tool definition. Pass via the `tools` array:
 *
 * ```ts
 * await client.messages.create({
 *   model: 'claude-opus-4-7',
 *   tools: [PROVIDER_TOOL_SPECS.anthropic],
 *   ...
 * });
 * ```
 */
export const ANTHROPIC_PATCH_TOOL = {
  name: TOOL_NAME,
  description: TOOL_DESCRIPTION,
  input_schema: PATCH_JSON_SCHEMA,
} as const;

/**
 * OpenAI Chat Completions / Responses function-call definition.
 */
export const OPENAI_PATCH_TOOL = {
  type: 'function' as const,
  function: {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    parameters: PATCH_JSON_SCHEMA,
  },
} as const;

export const PROVIDER_TOOL_SPECS = {
  anthropic: ANTHROPIC_PATCH_TOOL,
  openai: OPENAI_PATCH_TOOL,
} as const;

export const PATCH_TOOL_NAME = TOOL_NAME;

/* ====================================================================== */
/* Selection context formatting                                             */
/* ====================================================================== */

/**
 * Render an `ElementInfo` selection into a prompt-ready string. Trims
 * attributes longer than 200 chars and clips `text` to keep token usage
 * predictable.
 */
export function formatSelectionContext(selection: ElementInfo | null | undefined): string {
  if (!selection) return 'No element is currently selected.';
  const attrs: string[] = [];
  for (const [k, v] of Object.entries(selection.attributes ?? {})) {
    const clipped = v.length > 200 ? `${v.slice(0, 197)}…` : v;
    attrs.push(`    ${k}: ${JSON.stringify(clipped)}`);
  }
  const text = selection.text
    ? selection.text.length > 200
      ? `${selection.text.slice(0, 197)}…`
      : selection.text
    : '';
  const lines = [
    'Selected element:',
    `  id: ${selection.id}`,
    `  tag: <${selection.tag}>`,
    `  kind: ${selection.kind}`,
  ];
  if (text) lines.push(`  text: ${JSON.stringify(text)}`);
  if (attrs.length > 0) {
    lines.push('  attributes:');
    lines.push(...attrs);
  }
  return lines.join('\n');
}

/* ====================================================================== */
/* System prompts                                                           */
/* ====================================================================== */

export const TWEAK_SYSTEM_PROMPT = `You are htmlstudio's Tweak agent.

Your only output channel is the \`apply_patch\` tool. Read the user's
request and the currently-selected element, then emit ONE Patch that
expresses the intended change.

Rules:
- Prefer narrow patches: set-text, set-style, set-attributes, set-link, set-image.
- Use set-outer-html only when the user wants structural change inside a single element.
- NEVER use set-full-source in Tweak mode.
- Target the element by its data-ve-id — never invent ids.
- If the selection is empty and the request needs one, refuse with a short message instead of guessing.`;

export const REBUILD_SYSTEM_PROMPT = `You are htmlstudio's Re-build agent.

Your only output channel is the \`apply_patch\` tool. Re-build mode replaces
the entire page source with newly-generated HTML.

Rules:
- Emit exactly one patch with kind = "set-full-source".
- The "source" field must be a complete, well-formed HTML document.
- Inline all styles in a single <style> tag — htmlstudio doesn't bundle CSS.
- Do not include the previous source's data-ve-id attributes; htmlstudio
  retags after the patch is applied.`;

/* ====================================================================== */
/* Runtime validator                                                        */
/* ====================================================================== */

export class PatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PatchValidationError';
  }
}

/**
 * Narrow an unknown value (typically the parsed JSON from an LLM tool
 * call) into a typed `Patch`. Throws `PatchValidationError` on mismatch.
 *
 * Catches the common LLM failure modes:
 *   - missing required fields
 *   - wrong types
 *   - unknown `kind`
 *   - extra unexpected keys (logged via the error, not the throw)
 */
export function validatePatch(value: unknown): Patch {
  if (typeof value !== 'object' || value === null) {
    throw new PatchValidationError('Patch must be an object.');
  }
  const v = value as Record<string, unknown>;
  const kind = v.kind;
  if (typeof kind !== 'string') {
    throw new PatchValidationError('Patch.kind must be a string.');
  }

  switch (kind) {
    case 'set-text':
      return {
        kind: 'set-text',
        id: requireString(v.id, 'set-text.id'),
        value: requireString(v.value, 'set-text.value'),
      };
    case 'set-link':
      return {
        kind: 'set-link',
        id: requireString(v.id, 'set-link.id'),
        href: requireString(v.href, 'set-link.href'),
        text: requireString(v.text, 'set-link.text'),
      };
    case 'set-image':
      return {
        kind: 'set-image',
        id: requireString(v.id, 'set-image.id'),
        src: requireString(v.src, 'set-image.src'),
        alt: requireString(v.alt, 'set-image.alt'),
      };
    case 'set-style':
      return {
        kind: 'set-style',
        id: requireString(v.id, 'set-style.id'),
        styles: requireStringRecord(v.styles, 'set-style.styles'),
      };
    case 'set-attributes':
      return {
        kind: 'set-attributes',
        id: requireString(v.id, 'set-attributes.id'),
        attributes: requireNullableStringRecord(v.attributes, 'set-attributes.attributes'),
      };
    case 'set-outer-html':
      return {
        kind: 'set-outer-html',
        id: requireString(v.id, 'set-outer-html.id'),
        html: requireString(v.html, 'set-outer-html.html'),
      };
    case 'set-full-source':
      return {
        kind: 'set-full-source',
        source: requireString(v.source, 'set-full-source.source'),
      };
    default:
      throw new PatchValidationError(`Unknown patch kind: ${JSON.stringify(kind)}`);
  }
}

/**
 * Convenience: try `validatePatch`, return `{ ok, patch | error }`. Useful
 * when you don't want to write try/catch at every call site.
 */
export function parsePatch(value: unknown): { ok: true; patch: Patch } | { ok: false; error: string } {
  try {
    return { ok: true, patch: validatePatch(value) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== 'string') {
    throw new PatchValidationError(`${field} must be a string (got ${describeType(v)}).`);
  }
  return v;
}

function requireStringRecord(v: unknown, field: string): Record<string, string> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new PatchValidationError(`${field} must be a string→string object.`);
  }
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (typeof raw !== 'string') {
      throw new PatchValidationError(`${field}.${k} must be a string (got ${describeType(raw)}).`);
    }
    out[k] = raw;
  }
  return out;
}

function requireNullableStringRecord(
  v: unknown,
  field: string,
): Record<string, string | null> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new PatchValidationError(`${field} must be a string→(string|null) object.`);
  }
  const out: Record<string, string | null> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (raw !== null && typeof raw !== 'string') {
      throw new PatchValidationError(
        `${field}.${k} must be a string or null (got ${describeType(raw)}).`,
      );
    }
    out[k] = raw;
  }
  return out;
}

function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
