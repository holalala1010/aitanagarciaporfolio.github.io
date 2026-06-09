import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

code = code.replace(
  'open-link="mailto:aitanagarciagarcia.contacto@gmail.com" canvas-text="value: aitanagarciagarcia.contacto@gmail.com; font: Chakra Petch; fontSize: 36; width: 1024; height: 60; worldWidth: 2.4; color: #e4def7" position="0.35 -0.2 0.01"',
  'open-link="mailto:aitanagarciagarcia.contacto@gmail.com" canvas-text="value: aitanagarciagarcia.contacto@gmail.com; font: Chakra Petch; fontSize: 36; width: 1024; height: 60; worldWidth: 2.4; color: #e4def7; align: left" position="0.45 -0.25 0.01"'
);

code = code.replace(
  'open-link="https://www.linkedin.com/in/aitana-garcía-garcía-88313b167" canvas-text="value:        /in/aitana-garcía-garcía; font: Chakra Petch; fontSize: 36; width: 1024; height: 60; worldWidth: 2.4; color: #e4def7" position="0 -0.5 0.01"',
  'open-link="https://www.linkedin.com/in/aitana-garcía-garcía-88313b167" canvas-text="value: /in/aitana-garcía-garcía; font: Chakra Petch; fontSize: 36; width: 1024; height: 60; worldWidth: 2.4; color: #e4def7; align: left" position="0.45 -0.45 0.01"'
);

code = code.replace(
  '<a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/Gmail_icon.png" position="-0.41 -0.15 0.03" scale="0.1 0.1 1"></a-image>',
  '<a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/Gmail_icon.png" position="-0.85 -0.25 0.03" scale="0.1 0.1 1"></a-image>'
);

code = code.replace(
  '<a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/LinkedIn_logo.png" position="-0.41 -0.34 0.03" scale="0.1 0.1 1"></a-image>',
  '<a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/LinkedIn_logo.png" position="-0.85 -0.45 0.03" scale="0.1 0.1 1"></a-image>'
);

fs.writeFileSync('./src/App.tsx', code);
