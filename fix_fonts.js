import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

// Replace Google Fonts Link
code = code.replace(
  'family=Quicksand:wght@700&family=Ubuntu:wght@400;700',
  'family=Chakra+Petch:wght@400;700'
);

// Replace font names in JS styles and A-Frame components
code = code.replace(/Quicksand/g, 'Chakra Petch');
code = code.replace(/Ubuntu/g, 'Chakra Petch');

fs.writeFileSync('./src/App.tsx', code);
