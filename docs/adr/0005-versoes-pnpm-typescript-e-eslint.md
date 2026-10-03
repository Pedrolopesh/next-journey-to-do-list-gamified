# ADR-0005: versões de pnpm, TypeScript e configuração do ESLint

- Data: 2026-10-03
- Status: aceita
- Fase do plano: Fase 1, passos 1 e 8 a 10

## Contexto

Três fatos encontrados na Fase 1:

1. O corepack não conseguiu ativar o pnpm 12.8.1 (a mais recente) na máquina de desenvolvimento (`Cannot find module ... pnpm.cjs`). O pnpm 11.28.3 funcionou.
2. O npm oferece o TypeScript 7.x como `latest`, mas o `typescript-eslint` 8.71 só aceita `typescript <6.1`. Expo e NestJS também seguem a linha 5.x.
3. O ESLint 9 resolve o `eslint.config.js` a partir da pasta em que roda, não do arquivo. O lint-staged roda da raiz, então não achava a configuração de cada pacote.

## Decisão

- **pnpm 11.28.3**, fixado no campo `packageManager` (o corepack usa exatamente essa versão).
- **TypeScript `~5.9`**, fixado nos pacotes que o usam.
- **ESLint 9** (flat config), com o lint-staged chamando `eslint --flag v10_config_lookup_from_file`, que faz o ESLint procurar a configuração perto de cada arquivo (padrão do ESLint 10). O `eslint` também fica nas `devDependencies` da raiz.
- Mensagens de commit: o commitlint exige assunto em minúscula depois do tipo.

## Consequências

- Subir de versão é uma decisão consciente (novo ADR), não um efeito de `pnpm add`.
- Quando o `typescript-eslint` aceitar o TypeScript 6/7 e o Expo/Nest acompanharem, reavaliar.
- Ao migrar para o ESLint 10, a flag deixa de ser necessária.
