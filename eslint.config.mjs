import next from "eslint-config-next";

// Конфиг ESLint 9 (flat). Зависимости уже стояли в package.json, но самого
// файла не было — `npm run lint` падал ещё до проверки кода.
export default [
  ...next,
  { ignores: [".next/**", "node_modules/**", "public/**"] },
];
