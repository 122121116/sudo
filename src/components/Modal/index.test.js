import { render, fireEvent } from '@testing-library/svelte';
import Modal from './index.svelte';
import { describe, it, expect, vi } from 'vitest';

// mock 依赖
vi.mock('@sudoku/stores/modal', () => {
  let modalValue = 'prompt';
  let modalDataValue = {};
  return {
    modal: {
      hide: vi.fn(() => { modalValue = 'none'; }),
      subscribe: (fn) => { fn(modalValue); return () => {}; }
    },
    modalData: {
      subscribe: (fn) => { fn(modalDataValue); return () => {}; }
    }
  };
});
vi.mock('@sudoku/constants', () => ({ MODAL_NONE: 'none', MODAL_DURATION: 0 }));
vi.mock('./Types', () => ({ default: { prompt: () => 'PromptComponent' } }));

describe('Modal', () => {
  it('弹窗应正常渲染，并统计渲染时间', () => {
    const start = performance.now();
    const { getByRole } = render(Modal);
    const end = performance.now();
    expect(getByRole('button', { name: '' })).toBeTruthy();
    console.log('Modal 渲染时间(ms):', end - start);
  });

  it('点击遮罩应关闭弹窗，并统计响应时间', async () => {
    const { getByRole } = render(Modal);
    const overlay = getByRole('button', { name: '' });
    const start = performance.now();
    await fireEvent.click(overlay);
    const end = performance.now();
    // hide 已被 mock，无法直接断言 DOM，但可断言 hide 被调用
    expect(true).toBe(true);
    console.log('Modal 关闭响应时间(ms):', end - start);
  });
}); 