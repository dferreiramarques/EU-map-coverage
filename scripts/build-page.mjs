// Injects src/shapes.json into src/template.html and writes a standalone index.html.
import fs from 'fs';
const u = p => new URL(p, import.meta.url);
const tpl = fs.readFileSync(u('../src/template.html'), 'utf8')
  .replace('__SHAPES__', fs.readFileSync(u('../src/shapes.json'), 'utf8').trim());
// <title>, font links and <style> go in <head>; the rest is the body.
const cut = tpl.indexOf('<div class="wrap">');
const head = tpl.slice(0, cut).trim(), body = tpl.slice(cut).trim();
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body style="margin:0">
${body}
</body>
</html>
`;
fs.writeFileSync(u('../index.html'), html);
console.log('index.html written (' + Math.round(html.length / 1024) + ' KB)');
