# Finance Tracker

Frontend independente para controle financeiro pessoal, construído com Vue 3, TypeScript, Vite, Pinia, Tailwind CSS e Unovis.

## Desenvolvimento

Requer Node.js LTS.

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm test
npm run build
```

Os dados são inicializados a partir de fixtures e persistidos no `localStorage` sob a chave `finance-tracker:v1`.
