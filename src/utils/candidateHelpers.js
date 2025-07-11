import { candidates } from '@sudoku/stores/candidates';
import { get } from 'svelte/store';

// 扩展候选值功能
export const setCandidates = (position, values) => {
    // 获取当前候选值状态
    const currentCandidates = get(candidates);

    // 创建一个新的状态对象
    const newCandidates = { ...currentCandidates };

    // 设置新的候选值
    const key = `${position.x},${position.y}`;
    newCandidates[key] = values;

    // 更新候选值状态
    candidates.set(newCandidates);
};

export const clearCandidates = (position) => {
    // 获取当前候选值状态
    const currentCandidates = get(candidates);

    // 创建一个新的状态对象
    const newCandidates = { ...currentCandidates };

    // 删除指定位置的候选值
    const key = `${position.x},${position.y}`;
    delete newCandidates[key];

    // 更新候选值状态
    candidates.set(newCandidates);
};

// 游戏胜利检查函数
export const checkGameWin = (userGrid, invalidCells, wrongCells) => {
    // 检查是否所有格子都已填写
    let isComplete = true;
    for (let y = 0; y < userGrid.length; y++) {
        for (let x = 0; x < userGrid[y].length; x++) {
            if (userGrid[y][x] === 0) {
                isComplete = false;
                break;
            }
        }
        if (!isComplete) break;
    }
    // 如果游戏完成且没有错误，直接弹出胜利弹窗
    if (isComplete) {
        const hasErrors = invalidCells.length > 0 || wrongCells.length > 0;
        if (!hasErrors) {
            // 先关闭其他弹窗再弹出胜利弹窗
            import('@sudoku/stores/modal').then(({ modal }) => {
                modal.hide();
                setTimeout(() => {
                    modal.show('gameover');
                }, 50);
            });
            // 也可以设置gameWon为true（如果有用到）
            import('@sudoku/stores/game').then(({ gameWon }) => {
                gameWon.set(true);
            });
        }
    }
};

