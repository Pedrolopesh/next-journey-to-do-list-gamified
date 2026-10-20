import './inventario.css';

import { h, panel } from '../dom';
import type { LabPage } from '../page';
import {
  PLANNED,
  type PlannedStatus,
  type PlannedUtility,
  type SpritePreview,
  STATUS_LABEL,
} from './pets-montarias-dados';

const BADGE: Record<PlannedStatus, string> = {
  viavel: 'ok',
  despriorizado: 'wait',
  bloqueado: 'no',
};

/** Caminhada animada: a folha vira fundo de um quadro e o CSS desliza de quadro em quadro. */
function preview(sprite: SpritePreview): HTMLElement {
  const { scale, frameWidth, frameHeight, frames } = sprite;
  const box = h('div', 'pet-sprite');
  box.style.width = `${frameWidth * scale}px`;
  box.style.height = `${frameHeight * scale}px`;
  box.style.backgroundImage = `url(/lab/pets/${sprite.sheet})`;
  box.style.backgroundSize = `${sprite.sheetWidth * scale}px auto`;
  const x = sprite.col * frameWidth * scale;
  const y = sprite.row * frameHeight * scale;
  box.style.setProperty('--from', `${-x}px ${-y}px`);
  box.style.setProperty('--to', `${-(x + frames * frameWidth * scale)}px ${-y}px`);
  box.style.setProperty('--frames', String(frames));
  box.title = sprite.label;
  return h('figure', 'pet-figure', box, h('figcaption', 'meta', sprite.label));
}

function card(item: PlannedUtility): HTMLElement {
  const wrap = h('div', 'inv-card pet-card');
  wrap.dataset.free = String(item.status !== 'bloqueado');
  const stage = h('div', 'pet-stage');
  if (item.previews) stage.append(...item.previews.map(preview));
  else stage.append(h('span', 'meta', item.status === 'bloqueado' ? 'bloqueado' : 'sem prévia'));
  const link = h('a', '', item.name);
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  const badges = h(
    'div',
    'chips',
    h('span', `badge ${BADGE[item.status]}`, STATUS_LABEL[item.status]),
    h('span', 'badge', item.license),
  );
  wrap.append(
    stage,
    h('div', 'inv-name', link),
    badges,
    h('div', 'inv-authors', `Autor: ${item.author}`),
    h('p', 'meta', item.note),
  );
  return wrap;
}

/** Pets, montarias e veículos: o que existe fora do gerador de personagens, com prévia e licença. */
export const petsPage: LabPage = {
  id: 'pets',
  label: 'Pets e montarias',
  mount(host: HTMLElement): void {
    const groups = [...new Set(PLANNED.map((item) => item.group))];
    const license = h('div', 'license-banner');
    license.setAttribute('role', 'note');
    license.innerHTML =
      '<strong>Regra de licença:</strong> só entra obra <strong>CC0</strong>, <strong>OGA-BY</strong> ou <strong>CC-BY</strong> (com crédito ao autor). Obra só <strong>CC-BY-SA</strong> ou <strong>GPL</strong> fica <strong>bloqueada</strong>. <strong>Despriorizado</strong> quer dizer que não foi encontrado asset pronto e livre no padrão do personagem; fica para depois.';
    host.append(
      h('h1', '', 'Pets e montarias'),
      h(
        'p',
        'meta',
        'Companheiros e transportes para o personagem: gatos, cães, cavalo, dragões, monstros, moto e carro. Nada disso vem do gerador LPC; cada obra foi procurada na OpenGameArt (pesquisa de 2026-10-19). As prévias são as folhas originais, só para validar o visual; ainda não entram no jogo. Confira a licença na página de cada obra antes de importar.',
      ),
      license,
      ...groups.map((group) =>
        panel(
          group,
          h('div', 'inv-grid pet-grid', ...PLANNED.filter((i) => i.group === group).map(card)),
        ),
      ),
    );
  },
};
