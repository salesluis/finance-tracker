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

Por padrão, os dados são inicializados a partir de fixtures e persistidos no `localStorage`. Para usar uma API externa, copie `.env.example`, defina `VITE_DATA_SOURCE=api` e informe `VITE_API_BASE_URL`.

Consulte [Repositórios de dados e integração com a API](docs/data-repositories.md) para entender a abstração, implementar outro adaptador e seguir o contrato REST esperado pelo frontend.
