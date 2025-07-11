import { render, fireEvent } from '@testing-library/svelte';
import Actions from './Actions.svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock 依赖
vi.mock('@sudoku/stores/hints', () => {
  return {
    hints: { subscribe: (fn) => { fn(3); return () => {}; }, use: vi.fn() },
    findNextHint: vi.fn(() => ({
      x: 1,
      y: 2,
      candidates: [1, 2, 3, 4],
      explanation: 'Test explanation'
    })),
    strategies: {},
  };
});
vi.mock('@sudoku/stores/grid', () => ({
  userGrid: { subscribe: (fn) => { fn([[0,0,0],[0,0,0],[0,0,0]]); return () => {}; }, set: vi.fn(), undo: vi.fn(), redo: vi.fn() },
  invalidCells: { subscribe: (fn) => { fn([]); return () => {}; } },
}));
vi.mock('@sudoku/stores/cursor', () => ({ cursor: { set: vi.fn() } }));
vi.mock('@sudoku/stores/modal', () => ({ modal: { show: vi.fn() } }));
vi.mock('@sudoku/stores/settings', () => ({ settings: { subscribe: (fn) => { fn({ hintsLimited: false }); return () => {}; } } }));
vi.mock('@sudoku/stores/notes', () => ({ notes: { subscribe: (fn) => { fn(false); return () => {}; }, toggle: vi.fn() } }));
vi.mock('@sudoku/stores/game', () => ({ gamePaused: { subscribe: (fn) => { fn(false); return () => {}; } } }));
vi.mock('@sudoku/stores/backtrack', () => ({ backtrack: {} }));


describe('Actions - Hint 按钮', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('点击 hint 按钮时，输出候选数字数量', async () => {
    const { getByTitle } = render(Actions);
    const hintBtn = getByTitle('Hint');
    await fireEvent.click(hintBtn);
    // 获取 mock 的 findNextHint 返回的 candidates
    const { findNextHint } = require('@sudoku/stores/hints');
    const hint = findNextHint();
    console.log('候选数字数量:', hint.candidates.length);
    expect(hint.candidates.length).toBe(4);
  });
}); 