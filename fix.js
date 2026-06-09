import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');
code = code.replace(/document\.createElement\('a-sphere'\)/g, "document.createElement('a-octahedron')");
code = code.replace(/<a-cone /g, '<a-cone segments-radial="4" ');
code = code.replace(/document\.createElement\('a-cylinder'\)/g, "document.createElement('a-box')");
code = code.replace(/particle\.setAttribute\('radius', radius\.toString\(\)\);/g, "particle.setAttribute('width', (radius*2).toString()); particle.setAttribute('depth', (radius*2).toString());");
fs.writeFileSync('./src/App.tsx', code);
