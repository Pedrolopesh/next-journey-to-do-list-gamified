import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { useCharacterDraft } from '@/features/onboarding/character-draft';
import { useOnboardingFlow } from '@/features/onboarding/flow-store';
import { DEFAULT_LOOK } from '@/features/qg/options';

import { ChoiceList } from '../choice-list';
import { CodeInput } from '../code-input';

describe('ChoiceList', () => {
  it('marks the chosen option and reports the change', async () => {
    const onChange = jest.fn();
    await render(
      <ChoiceList
        label="Meta"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Primeira' },
          { value: 'b', label: 'Segunda' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Primeira' }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Segunda' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('CodeInput', () => {
  function Harness({ onValue }: { onValue: (value: string) => void }) {
    const [value, setValue] = useState('');
    return (
      <CodeInput
        value={value}
        length={6}
        autoFocus={false}
        onChange={(next) => {
          setValue(next);
          onValue(next);
        }}
      />
    );
  }

  it('accepts only digits and at most 6', async () => {
    const onValue = jest.fn();
    await render(<Harness onValue={onValue} />);
    const input = screen.getByDisplayValue('');
    await fireEvent.changeText(input, '12a34-56789');
    expect(onValue).toHaveBeenLastCalledWith('123456');
  });
});

describe('onboarding state', () => {
  it('the character draft goes back to the default', () => {
    const { setName, setCharacterClass, reset } = useCharacterDraft.getState();
    setName('Aria');
    setCharacterClass('mage');
    reset();
    expect(useCharacterDraft.getState()).toMatchObject({
      name: '',
      characterClass: null,
      look: DEFAULT_LOOK,
    });
  });

  it('the end of onboarding turns the finishing mode on and off', () => {
    useOnboardingFlow.getState().setFinishing(true);
    expect(useOnboardingFlow.getState().finishing).toBe(true);
    useOnboardingFlow.getState().setFinishing(false);
    expect(useOnboardingFlow.getState().finishing).toBe(false);
  });
});
