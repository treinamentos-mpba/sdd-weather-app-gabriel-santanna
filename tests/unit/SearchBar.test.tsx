import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it.each(['', '   '])('não dispara onSearch para entrada vazia ou espaços: %j', async (query) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    if (query) await user.type(input, query);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Digite o nome de uma cidade.');
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');

    await user.keyboard('{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it.each(['clique', 'Enter'])('envia o termo aparado uma vez por %s', async (submission) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByLabelText('Buscar cidade');
    await user.type(input, '  São Paulo  ');
    expect(onSearch).not.toHaveBeenCalled();

    if (submission === 'clique') {
      await user.click(screen.getByRole('button', { name: 'Buscar' }));
    } else {
      await user.keyboard('{Enter}');
    }

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
