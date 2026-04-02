const typeScriptCommands = [
  'npm exec eslint -- --fix --max-warnings=0',
  'npm exec prettier -- --write',
];

const prettierCommands = ['npm exec prettier -- --write --ignore-unknown'];

export default {
  'src/**/*.{ts,tsx}': typeScriptCommands,
  '**/*.{json,md,css,yml,yaml}': prettierCommands,
  '**/*.{js,jsx,mjs,cjs}': prettierCommands,
};
