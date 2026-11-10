## Why

O app pede o aceite dos Termos de Uso e da Política de Privacidade na tela de entrada, mas os dois textos não existem no app: os links da tela de entrada não levam a lugar nenhum e as lojas exigem uma política de privacidade publicada em URL pública. O Pedro já tem os textos da plataforma We Party (Termos e Condições de Uso e Política de Privacidade) e pediu para adaptá-los ao Next Journey e servi-los como texto por um endpoint, para o app só renderizar o que a API devolve.

## What Changes

- **Textos como dado na API.** Dois documentos em português (`terms` e `privacy`), versionados no código da API, com título, versão, data e seções (cabeçalho, parágrafos e itens). Uma versão única, `LEGAL_VERSION`, mora em `packages/contracts` e é a mesma que o app envia como `termsVersion` no aceite.
- **Endpoint JSON público.** `GET /v1/legal/documents/:slug` devolve o documento (`LegalDocument`); `slug` desconhecido dá `404`.
- **Página pública para as lojas.** `GET /legal/:slug` (fora do prefixo `/v1`, para a URL ser estável) devolve o mesmo texto em HTML simples, que serve de URL pública da política de privacidade.
- **Tela no app.** Uma tela `legal/[slug]` mostra o texto devolvido pela API (carregando, erro com "Tentar de novo" e rolagem). Os links "Termos de Uso" e "Política de Privacidade" da tela de entrada passam a abri-la, e as Configurações ganham as duas linhas.
- **Dado do controlador.** Nome e CNPJ da We Tech Hub Technologies Ltda ficam no texto; o e-mail de contato é opcional, configurado por `LEGAL_CONTACT_EMAIL`, e a seção de contato só aparece quando ele está definido.
- **Idade.** A faixa etária informada no app é dado estatístico e opcional; a classificação etária de uso é a da loja. A pendência de revisão jurídica da coleta de idade deixa de existir.

## Capabilities

### New Capabilities

- `legal-documents`: Termos de Uso e Política de Privacidade servidos como texto pela API, em JSON e em HTML, e exibidos no app.

### Modified Capabilities

<!-- Nenhuma: o aceite dos Termos continua em `termsVersion` do cadastro por e-mail. -->

## Fora do escopo

- Pedir um novo aceite quando a versão mudar (o aceite continua sendo continuar na tela de entrada).
- Tradução dos textos para outro idioma.
- Revisão jurídica final: os textos são uma adaptação dos documentos da We Party e devem ser revisados por quem responde pelo produto antes do envio às lojas.

## Segurança

- Rotas públicas somente de leitura, sem entrada do cliente além do `slug`, que é validado contra uma lista fechada.
- O HTML é gerado com escape de todo texto; sem script e sem recurso externo.
- Os textos não trazem dado de infraestrutura nem segredo; o e-mail de contato vem do ambiente, não do repositório.
