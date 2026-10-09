import { render, screen } from '@testing-library/react-native';

import { PasswordChecklist } from '../password-checklist';

describe('PasswordChecklist', () => {
  it('marca as regras atendidas conforme a senha', async () => {
    const { rerender } = await render(<PasswordChecklist password="" />);
    expect(screen.getByLabelText('Pelo menos 8 caracteres: pendente')).toBeTruthy();
    await rerender(<PasswordChecklist password="Abcdef1!" />); // scan-allow: senha falsa de teste
    for (const rule of [
      'Pelo menos 8 caracteres',
      'Uma letra maiúscula',
      'Um número',
      'Um caractere especial',
    ]) {
      expect(screen.getByLabelText(`${rule}: atendida`)).toBeTruthy();
    }
  });
});
