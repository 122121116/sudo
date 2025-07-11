import { setCandidates, clearCandidates } from './candidateHelpers';
import { candidates } from '@sudoku/stores/candidates';
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 模拟 candidates store
vi.mock('@sudoku/stores/candidates', () => {
  let store = {};
  return {
    candidates: {
      set: (val) => { store = val; },
      subscribe: (fn) => { fn(store); return () => {}; }
    }
  };
});

describe('candidateHelpers', () => {
  beforeEach(() => {
    candidates.set({});
  });

  it('setCandidates 应正确设置候选值，并统计执行时间', () => {
    const start = performance.now();
    setCandidates({ x: 1, y: 2 }, [1, 2, 3]);
    const end = performance.now();
    const result = get(candidates);
    expect(result['1,2']).toEqual([1, 2, 3]);
    console.log('setCandidates 执行时间(ms):', end - start);
  });

  it('clearCandidates 应正确清除候选值，并统计执行时间', () => {
    setCandidates({ x: 1, y: 2 }, [1, 2, 3]);
    const start = performance.now();
    clearCandidates({ x: 1, y: 2 });
    const end = performance.now();
    const result = get(candidates);
    expect(result['1,2']).toBeUndefined();
    console.log('clearCandidates 执行时间(ms):', end - start);
  });
}); 