import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DragDropCanvas from '../components/Designer/DragDropCanvas';
import { VB6Provider } from '../context/VB6Context';
import { useVB6Store } from '../stores/vb6Store';

describe('FormDesigner E2E', () => {
  it('creates and selects a command button', () => {
    const { container } = render(
      <VB6Provider>
        <DragDropCanvas />
      </VB6Provider>
    );
    act(() => {
      useVB6Store.getState().createControl('CommandButton', 30, 40);
      const id = useVB6Store.getState().controls[0].id;
      useVB6Store.getState().selectControls([id]);
    });
    const button = container.querySelector('[data-testid="CommandButton-1"]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Command1');
    expect(button).toHaveStyle('left: 30px');
    expect(button).toHaveStyle('top: 40px');
  });
});
