import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/ shadow="cast: true; receive: true"/g, '');
code = code.replace(/ shadow="cast: true"/g, '');
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed shadows');
