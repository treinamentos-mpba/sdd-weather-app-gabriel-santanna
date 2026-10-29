import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('Estados da consulta meteorológica', () => {
  it('anuncia carregamento como status sem botão de nova tentativa', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status').textContent).toBe('Carregando dados meteorológicos...');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('apresenta a mensagem de erro como alerta e dispara retry uma vez por clique', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Verifique sua conexão com a internet." onRetry={onRetry} />);

    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByRole('heading', { name: 'Não foi possível carregar o clima' }),
    ).toBeTruthy();
    expect(within(alert).getByText('Verifique sua conexão com a internet.')).toBeTruthy();
    expect(onRetry).not.toHaveBeenCalled();

    const retry = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retry.getAttribute('type')).toBe('button');
    await user.click(retry);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(['{Enter}', ' '])('permite tentar novamente com teclado (%s)', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="A consulta demorou além do esperado." onRetry={onRetry} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tentar novamente' }));
    await user.keyboard(key);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('apresenta estado vazio com título e dica, sem semântica de erro ou retry', () => {
    render(<EmptyState />);

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeTruthy();
    expect(screen.getByText('Confira a grafia ou tente buscar outra cidade.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
