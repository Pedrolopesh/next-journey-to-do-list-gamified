import { h, panel } from '../dom';
import type { LabPage } from '../page';
import { inventoryPage } from './inventario';
import { PLANNED, STATUS_LABEL } from './utilitarios-planejados';

function plannedTable(): HTMLElement[] {
  const body = h('tbody');
  for (const item of PLANNED) {
    const link = h('a', '', item.name);
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    const badge = h(
      'span',
      `badge ${item.status === 'viavel' ? 'ok' : item.status === 'bloqueado' ? 'no' : 'wait'}`,
      STATUS_LABEL[item.status],
    );
    body.append(
      h(
        'tr',
        '',
        h('td', '', item.group),
        h('td', '', link),
        h('td', '', badge),
        h('td', '', item.license),
        h('td', '', item.author),
        h('td', '', item.note),
      ),
    );
  }
  const table = h('table', 'inv-planned');
  table.append(
    h(
      'thead',
      '',
      h(
        'tr',
        '',
        ...['Tipo', 'Obra', 'Situação', 'Licença', 'Autor', 'Observação'].map((t) =>
          h('th', '', t),
        ),
      ),
    ),
    body,
  );
  return [
    panel(
      'Pets, montarias e veículos (fora do gerador)',
      h(
        'p',
        'meta',
        'Pesquisa na OpenGameArt em 2026-10-19. "Despriorizado" quer dizer que não foi encontrado asset pronto e livre no padrão do personagem; fica para depois. Licenças vêm da página de cada obra: conferir de novo antes de importar.',
      ),
      table,
    ),
  ];
}

/** Armas, escudos, ferramentas e o que mais o personagem pode carregar ou usar. */
export const utilitiesPage: LabPage = inventoryPage({
  id: 'utilitarios',
  label: 'Utilitários do personagem',
  title: 'Utilitários do personagem',
  intro:
    'Armas, escudos e ferramentas do gerador LPC (espada, arco, machado, enxada...) e, abaixo, o que existe fora dele: pets, cavalo, moto e carro, com a situação de cada um.',
  roots: ['weapons', 'tools'],
  extra: plannedTable,
});
