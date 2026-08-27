const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const maxBytes = 40000;

function scanTopLevel(source, mode) {
  const boundaries = [];
  let start = 0;
  let brace = 0;
  let paren = 0;
  let bracket = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') brace += 1;
    if (ch === '}') brace -= 1;
    if (ch === '(') paren += 1;
    if (ch === ')') paren -= 1;
    if (ch === '[') bracket += 1;
    if (ch === ']') bracket -= 1;
    if (brace < 0 || paren < 0 || bracket < 0) throw new Error(`Unbalanced ${mode} source near ${i}`);
    if (brace === 0 && paren === 0 && bracket === 0 && (ch === ';' || ch === '\n')) {
      boundaries.push(i + 1);
    }
  }
  if (brace !== 0 || paren !== 0 || bracket !== 0 || quote || blockComment) {
    throw new Error(`Unbalanced ${mode} source at end`);
  }
  return boundaries;
}

function splitSource(source, mode) {
  if (mode === 'JavaScript') {
    const lines = source.match(/[^\n]*\n|[^\n]+$/g) || [];
    const chunks = [];
    let start = 0;
    let end = 0;
    let lastValid = 0;
    while (start < lines.length) {
      end = Math.max(end, start);
      let candidate = '';
      lastValid = start;
      for (; end < lines.length; end += 1) {
        candidate += lines[end];
        if (Buffer.byteLength(candidate, 'utf8') > maxBytes && lastValid > start) break;
        try {
          new vm.Script(candidate);
          lastValid = end + 1;
        } catch {
          // The current line may be inside a multi-line statement.
        }
      }
      if (lastValid === start) throw new Error(`${mode} contains an indivisible block larger than ${maxBytes} bytes`);
      chunks.push(lines.slice(start, lastValid).join(''));
      start = lastValid;
      end = start;
    }
    return chunks;
  }
  const boundaries = scanTopLevel(source, mode);
  const chunks = [];
  let start = 0;
  let lastBoundary = 0;
  for (const boundary of boundaries) {
    const candidate = source.slice(start, boundary);
    if (Buffer.byteLength(candidate, 'utf8') > maxBytes && lastBoundary > start) {
      chunks.push(source.slice(start, lastBoundary));
      start = lastBoundary;
    }
    lastBoundary = boundary;
  }
  if (start < source.length) chunks.push(source.slice(start));
  if (chunks.some(chunk => Buffer.byteLength(chunk, 'utf8') > maxBytes)) {
    throw new Error(`${mode} contains an indivisible block larger than ${maxBytes} bytes`);
  }
  return chunks;
}

function writeChunks(sourceName, partPrefix, extension, mode) {
  const sourcePath = path.join(root, sourceName);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const chunks = splitSource(source, mode);
  const partFiles = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const file = `${partPrefix}-${String(index + 1).padStart(2, '0')}.${extension}`;
    fs.writeFileSync(path.join(root, file), chunks[index], 'utf8');
    partFiles.push(file);
  }
  return partFiles;
}

function removeGenerated(prefix, extension) {
  for (const file of fs.readdirSync(root)) {
    if (new RegExp(`^${prefix}-\\d+\\.${extension}$`).test(file)) fs.unlinkSync(path.join(root, file));
  }
}

removeGenerated('app-v4-part', 'js');

const appParts = writeChunks('app-source.js', 'app-v4-part', 'js', 'JavaScript');
const styleParts = writeChunks('styles-source.css', 'styles-part', 'css', 'CSS');

appParts.forEach((file, index) => {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  const isLast = index === appParts.length - 1;
  const wrapped = [
    'window.__SCENERY_APP_PARTS__ = window.__SCENERY_APP_PARTS__ || [];',
    `window.__SCENERY_APP_PARTS__[${index}] = ${JSON.stringify(raw)};`,
    isLast ? '(new Function(window.__SCENERY_APP_PARTS__.join("\\n")))();' : '',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, file), wrapped, 'utf8');
});

const appLoader = `/* Loader for the split application bundle. */\n(function () {\n  const parts = ${JSON.stringify(appParts)};\n  parts.forEach((src) => document.write('<script src="' + src + '"><\\/script>'));\n}());\n`;
const styleLoader = styleParts.map(file => `@import url("${file}");`).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'app.js'), appLoader, 'utf8');
fs.writeFileSync(path.join(root, 'styles.css'), styleLoader, 'utf8');

console.log(JSON.stringify({
  appParts: appParts.map(file => ({ file, bytes: Buffer.byteLength(fs.readFileSync(path.join(root, file)), 'utf8') })),
  styleParts: styleParts.map(file => ({ file, bytes: Buffer.byteLength(fs.readFileSync(path.join(root, file)), 'utf8') })),
  loaderBytes: {
    app: Buffer.byteLength(appLoader, 'utf8'),
    styles: Buffer.byteLength(styleLoader, 'utf8'),
  },
}, null, 2));
