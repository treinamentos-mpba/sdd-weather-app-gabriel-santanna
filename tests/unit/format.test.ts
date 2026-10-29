import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('getDayLabel', () => {
  it.each([
    { date: '2026-10-29', index: 0, expected: 'Hoje' },
    { date: '2026-10-30', index: 1, expected: 'Amanhã' },
  ])('retorna $expected para o índice $index', ({ date, index, expected }) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });

  it.each([
    { date: '2026-10-25', index: 2, expected: 'Dom' },
    { date: '2026-10-26', index: 3, expected: 'Seg' },
    { date: '2026-10-27', index: 4, expected: 'Ter' },
    { date: '2026-10-28', index: 5, expected: 'Qua' },
    { date: '2026-10-29', index: 6, expected: 'Qui' },
    { date: '2026-10-30', index: 7, expected: 'Sex' },
    { date: '2026-10-31', index: 8, expected: 'Sáb' },
  ])('usa o dia da data $date ($expected) nos demais índices', ({ date, index, expected }) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-01-01', '1 Jan'],
    ['2026-02-02', '2 Fev'],
    ['2026-03-03', '3 Mar'],
    ['2026-04-04', '4 Abr'],
    ['2026-05-05', '5 Mai'],
    ['2026-06-12', '12 Jun'],
    ['2026-07-07', '7 Jul'],
    ['2026-08-08', '8 Ago'],
    ['2026-09-09', '9 Set'],
    ['2026-10-29', '29 Out'],
    ['2026-11-11', '11 Nov'],
    ['2026-12-31', '31 Dez'],
  ])('formata %s como %s sem deslocar o dia', (date, expected) => {
    expect(getShortDate(date)).toBe(expected);
  });

  it('preserva o dia 29 de fevereiro em ano bissexto', () => {
    expect(getShortDate('2024-02-29')).toBe('29 Fev');
  });
});
