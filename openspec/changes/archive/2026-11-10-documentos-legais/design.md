## Context

O app mostra "Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade" na entrada, com os dois nomes sublinhados e sem ação. `TERMS_VERSION` (`2026-10-01`) é uma constante do app enviada como `termsVersion` em `POST /auth/email/start`, na confirmação do código e na exclusão. `docs/PRIVACIDADE.md` descreve os dados coletados, os direitos e os prazos de retenção, e foi a base para não afirmar nada que o app não faz.

## Goals / Non-Goals

**Goals:** textos adaptados e fiéis ao que o app faz; um endpoint que devolve texto; tela no app que só renderiza; URL pública para as lojas; uma única versão dos textos.
**Non-Goals:** novo aceite por mudança de versão; editor de textos; tradução.

## Decisions

- **Texto no código da API, não no banco.** O texto muda raramente e precisa de revisão em PR (repositório público, sem dado sensível). Cada documento é um objeto tipado em `apps/api/src/modules/legal/documents/`. Mudou o texto: sobe `LEGAL_VERSION` e a data.
- **`LEGAL_VERSION` em `packages/contracts`.** API e app importam a mesma constante; `TERMS_VERSION` do app passa a reexportá-la. Assim o `termsVersion` gravado na conta é sempre a versão do texto que a API serve.
- **Formato `LegalDocument`:** `{ slug, version, title, updatedAt, sections: [{ heading, paragraphs[], bullets[] }] }`. Sem Markdown nem HTML no dado: o React Native renderiza cada parte como `Text` e o HTML público é gerado no servidor com escape. Negrito e links ficam de fora de propósito (texto simples é o que as lojas e a acessibilidade pedem).
- **Dois caminhos.** `GET /v1/legal/documents/:slug` (JSON, sob o prefixo `/v1`, para o app) e `GET /legal/:slug` (HTML, excluído do prefixo para a URL pública ser estável). O caminho do JSON tem um segmento a mais para a exclusão de prefixo do HTML não pegar os dois.
- **Contato opcional.** `LEGAL_CONTACT_EMAIL` entra no esquema de ambiente como opcional; o serviço monta o documento com a seção "Contato" só quando ele existe. O nome e o CNPJ do controlador ficam em constantes, porque já são públicos (constam nos documentos da We Party).
- **App: página, não modal.** Os textos são longos e de leitura; uma tela empilhada com botão de voltar funciona na entrada (sem sessão) e nas Configurações. Busca com TanStack Query, `staleTime` longo, estados de carregando e de erro com "Tentar de novo".
- **Idade:** nenhuma mudança de código; a decisão fica registrada nos documentos (idade é estatística e opcional; classificação etária na loja).

## Risks / Trade-offs

- Os textos são uma adaptação, não uma revisão jurídica → ficam marcados na proposta como pendência de revisão por quem responde pelo produto antes da loja.
- Sem novo aceite por mudança de versão, quem aceitou a versão antiga não é avisado → fora do escopo, registrado para depois.
- A página pública depende de a API estar no ar → é a mesma disponibilidade do `/health` e do app.
