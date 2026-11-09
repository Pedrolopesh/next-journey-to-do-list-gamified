import { LEGAL_VERSION, type LegalDocument, type LegalSection } from '@nextjourney/contracts';

/** Controller of the personal data, as named in the source documents of the product owner. */
const CONTROLLER = 'WE TECH HUB TECHNOLOGIES LTDA';
const CONTROLLER_ID = '57.129.981/0001-99';

/** Date of the last change of the texts below. Bump it together with `LEGAL_VERSION`. */
const UPDATED_AT = '2026-11-08';

type Options = {
  /** Contact for data requests. The "Contact" section only exists when it is set. */
  contactEmail?: string | undefined;
};

function contactSection(number: number, email: string | undefined): LegalSection[] {
  if (!email) return [];
  return [
    {
      heading: `${number}. Contato`,
      paragraphs: [`Dúvidas e solicitações sobre estes textos ou sobre os seus dados: ${email}.`],
      bullets: [],
    },
  ];
}

function terms({ contactEmail }: Options): LegalDocument {
  const sections: LegalSection[] = [
    {
      heading: 'Bem-vindo',
      paragraphs: [
        'Bem-vindo ao Next Journey. Ao usar o aplicativo, você concorda com estes Termos e Condições de Uso. Leia com atenção.',
      ],
      bullets: [],
    },
    {
      heading: '1. Natureza do serviço e definições',
      paragraphs: [
        '1.1. Objeto: o Next Journey é um aplicativo pessoal de lista de tarefas gamificada. Os diários, as tarefas e os hábitos que você marca rendem EXP e moedas e fazem um personagem avançar por uma história em capítulos.',
        '1.2. Regras do jogo: o servidor decide a progressão. EXP, moedas, nível, capítulos e conquistas são calculados pela API, e o aplicativo apenas os mostra.',
        `1.3. Provedor: o Next Journey, de propriedade da ${CONTROLLER} (CNPJ ${CONTROLLER_ID}), atua como provedor de aplicação de internet, nos termos do art. 5º, inciso VII, da Lei 12.965/14 (Marco Civil da Internet).`,
        '1.4. Sem rede social: o aplicativo não tem perfis públicos, feed, comentários nem compras dentro dele. O que você cria é só seu.',
      ],
      bullets: [],
    },
    {
      heading: '2. Elegibilidade e conta',
      paragraphs: [
        '2.1. Idade: o uso deve respeitar a classificação etária indicada na loja de aplicativos. Menores de idade devem usar o aplicativo com o consentimento de um responsável legal.',
        '2.2. Entrada: a conta é criada ou acessada com um código enviado ao seu e-mail ou com o login do Google ou da Apple. Informe um e-mail seu, com acesso ativo.',
        '2.3. Veracidade: você é responsável pela veracidade dos dados que informar. Contas com dados falsos ou usadas de forma fraudulenta podem ser suspensas.',
        '2.4. Segurança: a conta é pessoal e intransferível. Quem tem acesso ao seu e-mail ou à sua conta Google ou Apple pode entrar na sua conta, então mantenha esses acessos protegidos. Toda atividade feita na conta é de sua responsabilidade.',
      ],
      bullets: [],
    },
    {
      heading: '3. Uso do aplicativo',
      paragraphs: [
        '3.1. Licença de uso: concedemos a você uma licença pessoal, não exclusiva, intransferível e revogável para usar o aplicativo.',
        '3.2. É vedado:',
      ],
      bullets: [
        'tentar acessar dados de outras contas ou burlar os limites e as proteções do serviço;',
        'usar automações, scripts ou outros meios que sobrecarreguem o serviço;',
        'explorar falhas de segurança sem reportá-las de forma responsável;',
        'usar o aplicativo para fins ilícitos.',
      ],
    },
    {
      heading: '4. Seu conteúdo',
      paragraphs: [
        '4.1. Os itens, as categorias, os nomes e os demais conteúdos que você cria são seus. Você nos autoriza a armazená-los e processá-los apenas para operar o aplicativo para você.',
        '4.2. Esse conteúdo não é publicado para outras pessoas.',
        '4.3. Você garante que o que escreve (como o nome do personagem) não é ilícito nem ofende direitos de terceiros.',
      ],
      bullets: [],
    },
    {
      heading: '5. Propriedade intelectual e créditos',
      paragraphs: [
        `O aplicativo, a marca e o jogo pertencem à ${CONTROLLER}. O código-fonte do projeto é aberto, sob a licença MIT. A arte em pixel art usa componentes de terceiros sob licenças abertas (Liberated Pixel Cup), e cada autor e licença estão listados no aplicativo, em Configurações › Créditos.`,
      ],
      bullets: [],
    },
    {
      heading: '6. Disponibilidade e limitação de responsabilidade',
      paragraphs: [
        '6.1. O aplicativo é oferecido como está. Não garantimos funcionamento ininterrupto nem ausência de erros, e podemos alterar, suspender ou encerrar funções.',
        '6.2. EXP, moedas, níveis e conquistas são elementos do jogo: não têm valor monetário e não podem ser trocados por dinheiro. As regras de pontuação e de conquistas podem ser ajustadas.',
        '6.3. O Next Journey é uma ferramenta de organização e motivação. Ele não oferece aconselhamento médico, psicológico, financeiro ou jurídico, e as metas que você escolhe são de sua responsabilidade.',
        '6.4. Na extensão permitida pela lei, não respondemos por danos indiretos do uso do aplicativo, como a perda de dados causada por falha do seu aparelho ou da sua conexão. Isso não afasta os direitos que a lei garante a você, inclusive os do Código de Defesa do Consumidor.',
      ],
      bullets: [],
    },
    {
      heading: '7. Privacidade e dados pessoais',
      paragraphs: [
        'O tratamento de dados pessoais segue a Política de Privacidade, que integra estes Termos e pode ser lida no aplicativo.',
      ],
      bullets: [],
    },
    {
      heading: '8. Exclusão da conta e penalidades',
      paragraphs: [
        '8.1. Você pode excluir a conta a qualquer momento em Configurações › Excluir conta. Os seus dados pessoais são apagados na hora e o restante é removido em até 30 dias, conforme a Política de Privacidade.',
        '8.2. A violação destes Termos pode resultar em advertência, suspensão temporária ou encerramento da conta, sem prejuízo de outras medidas cabíveis.',
      ],
      bullets: [],
    },
    {
      heading: '9. Alterações',
      paragraphs: [
        '9.1. Podemos alterar estes Termos. A versão e a data de atualização ficam no topo do documento, e avisaremos pelo aplicativo quando a mudança for relevante. Continuar usando o aplicativo depois do aviso significa aceitar a nova versão.',
      ],
      bullets: [],
    },
    {
      heading: '10. Lei aplicável',
      paragraphs: ['Estes Termos são regidos pelas leis da República Federativa do Brasil.'],
      bullets: [],
    },
    ...contactSection(11, contactEmail),
  ];
  return {
    slug: 'terms',
    version: LEGAL_VERSION,
    title: 'Termos e Condições de Uso',
    updatedAt: UPDATED_AT,
    sections,
  };
}

function privacy({ contactEmail }: Options): LegalDocument {
  const sections: LegalSection[] = [
    {
      heading: '1. Agente de tratamento (controlador)',
      paragraphs: [
        `O Next Journey, propriedade da ${CONTROLLER} (CNPJ ${CONTROLLER_ID}), é o controlador dos dados pessoais tratados no aplicativo e decide sobre esse tratamento em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).`,
      ],
      bullets: [],
    },
    {
      heading: '2. Dados tratados e finalidades',
      paragraphs: ['Para o aplicativo funcionar, tratamos os dados abaixo.'],
      bullets: [
        'Dados da conta: e-mail, um nome derivado do e-mail e o fuso horário. Finalidade: identificar a conta, enviar o código de entrada e virar o dia no seu fuso.',
        'Entrada com Google ou Apple: o identificador da sua conta no provedor, validado no servidor. Finalidade: permitir o login social. Não recebemos a senha do provedor.',
        'Perfil opcional: meta, faixa etária, gênero e a escolha de receber lembretes. Finalidade: personalizar a experiência e gerar estatísticas de uso. São opcionais, e você pode pular essas perguntas.',
        'Uso do aplicativo: itens, categorias, marcações, EXP, moedas, nível, conquistas, personagem e história. Finalidade: fazer o jogo funcionar e guardar o seu progresso.',
        'Aparelhos conectados: nome do aparelho e datas de entrada e de último uso. Finalidade: mostrar onde a conta está aberta e permitir encerrar sessões.',
        'Registro de aceite: data e versão dos Termos aceitos. Finalidade: comprovar o consentimento.',
        'Registros técnicos: identificador da requisição, erros e eventos de segurança, com o endereço IP sem o último número. Nunca registramos e-mail, senha nem token. Finalidade: segurança, prevenção de abuso e diagnóstico.',
      ],
    },
    {
      heading: '3. O que não coletamos',
      paragraphs: [
        'O Next Journey não coleta localização, contatos, fotos nem identificador de publicidade, não faz rastreamento entre aplicativos e não exibe anúncios.',
      ],
      bullets: [],
    },
    {
      heading: '4. Compartilhamento de dados',
      paragraphs: [
        'O Next Journey não comercializa dados pessoais. O compartilhamento ocorre apenas nas hipóteses abaixo.',
      ],
      bullets: [
        'Envio de e-mail: um provedor de e-mail transacional envia o código de entrada e os avisos da conta.',
        'Google e Apple: somente na validação do login social, quando você escolhe entrar por eles.',
        'Monitoramento de erros: um serviço de diagnóstico, quando ativado, pode receber registros técnicos sem e-mail, senha ou token.',
        'Provedores de infraestrutura: hospedagem e armazenamento do servidor e do banco de dados.',
        'Autoridades públicas: para cumprir ordem judicial ou obrigação legal.',
      ],
    },
    {
      heading: '5. Bases legais para o tratamento',
      paragraphs: ['Tratamos os dados com fundamento em:'],
      bullets: [
        'Execução de contrato: para o funcionamento do aplicativo e da sua conta.',
        'Consentimento: para os dados opcionais do perfil e para os lembretes.',
        'Legítimo interesse: para segurança, prevenção de fraude e abuso, melhoria do aplicativo e estatísticas de uso.',
        'Obrigação legal: para a guarda de registros quando a lei exigir.',
      ],
    },
    {
      heading: '6. Seus direitos (art. 18 da LGPD)',
      paragraphs: [
        'Você pode exercer os direitos abaixo, a maioria diretamente no aplicativo.',
        ...(contactEmail
          ? [
              'Para o que não puder ser feito pelo aplicativo, use o contato no fim deste documento.',
            ]
          : []),
      ],
      bullets: [
        'Confirmação e acesso: em Configurações, “Exportar meus dados” entrega um arquivo com tudo o que a conta guarda sobre você, sem senha nem tokens (até 3 pedidos por hora).',
        'Portabilidade: o mesmo arquivo pode ser levado para outro serviço.',
        'Correção: o nome, o fuso horário e o horário do lembrete podem ser alterados em Configurações.',
        'Eliminação: em Configurações, “Excluir conta” apaga os seus dados pessoais na hora, e o restante é removido em até 30 dias.',
        'Aparelhos conectados: em Configurações, “Aparelhos conectados” mostra onde a conta está aberta e permite encerrar uma sessão ou todas.',
        'Revogação do consentimento: você pode pular as perguntas opcionais e desligar os lembretes quando quiser.',
      ],
    },
    {
      heading: '7. Segurança',
      paragraphs: ['Adotamos medidas técnicas para proteger os seus dados.'],
      bullets: [
        'A comunicação com o servidor é criptografada (HTTPS).',
        'Senhas, quando existem, códigos de confirmação e links de nova senha são guardados somente como hash.',
        'No aparelho, a sessão fica no armazenamento seguro do sistema.',
      ],
    },
    {
      heading: '8. Prazos de retenção',
      paragraphs: [
        'Depois do encerramento da conta, alguns dados poderão ser mantidos apenas para defesa em processos ou cumprimento de dever legal.',
      ],
      bullets: [
        'Conta ativa: os dados ficam guardados enquanto a conta existir.',
        'Conta excluída: os dados pessoais são apagados na hora e o restante em até 30 dias.',
        'Cadastro que nunca confirmou o e-mail: apagado em 7 dias.',
        'Códigos, links e tokens expirados: apagados 7 dias depois de expirar.',
        'Contadores de tentativas de acesso: mantidos por até 1 dia.',
        'Cópias de segurança do banco de dados: mantidas por 7 dias.',
        'Registros técnicos: mantidos pelo tempo necessário para segurança e diagnóstico, respeitados os prazos legais.',
      ],
    },
    {
      heading: '9. Transferência internacional',
      paragraphs: [
        'Parte dos prestadores de serviço, como e-mail, login social e monitoramento, pode operar servidores fora do Brasil. Nesses casos, a transferência ocorre para prestadores que apresentem nível de proteção compatível com a LGPD.',
      ],
      bullets: [],
    },
    {
      heading: '10. Crianças e adolescentes',
      paragraphs: [
        'O Next Journey segue a classificação etária indicada na loja de aplicativos. A faixa etária que você pode informar no aplicativo é opcional e usada apenas de forma estatística: ela não libera nem bloqueia funções. Menores de idade devem usar o aplicativo com o consentimento de um responsável legal.',
      ],
      bullets: [],
    },
    {
      heading: '11. Incidente de segurança',
      paragraphs: [
        'Em caso de incidente de segurança que envolva dados pessoais, avisaremos as pessoas afetadas e a Autoridade Nacional de Proteção de Dados (ANPD) em prazo razoável, conforme a LGPD.',
      ],
      bullets: [],
    },
    {
      heading: '12. Alterações desta política',
      paragraphs: [
        'Podemos alterar esta política. A versão e a data de atualização ficam no topo do documento, e avisaremos pelo aplicativo quando a mudança for relevante.',
      ],
      bullets: [],
    },
    ...contactSection(13, contactEmail),
  ];
  return {
    slug: 'privacy',
    version: LEGAL_VERSION,
    title: 'Política de Privacidade',
    updatedAt: UPDATED_AT,
    sections,
  };
}

/** The legal texts of the app, in Portuguese, built once per process. */
export function buildLegalDocuments(
  options: Options = {},
): Record<'terms' | 'privacy', LegalDocument> {
  return { terms: terms(options), privacy: privacy(options) };
}
