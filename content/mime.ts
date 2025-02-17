import { Mimetype } from "../interfaces";

/**
 * Converts a mimetype to a string.
 */
export function stringifyMimetype(mimetype?: Mimetype): string {
  if (!mimetype) {
    return 'application/octet-stream';
  }
  let result = '';
  if (!mimetype.type) {
    return result;
  }
  result += mimetype.type;
  if (!mimetype.subtype) {
    return result;
  }
  result += '/';
  if (mimetype.prefix) {
    result += `${mimetype.prefix}.`;
  }
  result += mimetype.subtype;
  if (mimetype.suffix) {
    result += `+${mimetype.suffix}`;
  }
  if (mimetype.parameters) {
    for (const [key, value] of Object.entries(mimetype.parameters)) {
      result += `;${key}=${value}`;
    }
  }
  return result;
}

/**
 * Parses a mimetype from a string.
 */
export function parseMimetype(mimetype?: string): Mimetype {
  if (!mimetype) {
    return {type: 'application', subtype: 'octet-stream'};
  }
  let parameters: {[key: string]: string} | undefined = undefined;
  const paramParts = mimetype.split(';');
  if (paramParts.length > 1) {
    mimetype = mimetype.substring(0, paramParts[0].length);
    parameters = {};
    for (let i = 1; i < paramParts.length; i++) {
      const [key, value] = paramParts[i].trim().split('=');
      parameters[key] = value;
    }
  }
  const parts = mimetype.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid mimetype: ${mimetype}`);
  }
  const [type, rest] = parts;
  let subtype: string | undefined = undefined;
  let prefix: string | undefined = undefined;
  let suffix: string | undefined = undefined;
  const vndSplit = rest.lastIndexOf('.');
  if (vndSplit >= 0) {
    prefix = rest.slice(0, vndSplit);
    subtype = rest.slice(vndSplit + 1);
  } else {
    subtype = rest;
  }
  const suffixSplit = subtype.indexOf('+');
  if (suffixSplit >= 0) {
    suffix = subtype.slice(suffixSplit + 1);
    subtype = subtype.slice(0, suffixSplit);
  }
  return {
    type,
    subtype,
    prefix,
    suffix,
    parameters,
  };
}
