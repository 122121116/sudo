<script>
    import { candidates } from '@sudoku/stores/candidates';
    import { userGrid, invalidCells, wrongCells } from '@sudoku/stores/grid';
    import { cursor } from '@sudoku/stores/cursor';
    import { hints } from '@sudoku/stores/hints';
    import { notes } from '@sudoku/stores/notes';
    import { settings } from '@sudoku/stores/settings';
    import { gamePaused } from '@sudoku/stores/game';
    import { modal } from '@sudoku/stores/modal';
    import { strategies, findNextHint } from '@sudoku/stores/hints';
    import { backtrack } from '@sudoku/stores/backtrack';
    import { checkGameWin } from '../../../utils/candidateHelpers';
    import { get } from 'svelte/store';
    import { gameMode } from '@sudoku/game';
    import { GAME_MODES } from '@sudoku/constants';
    import game from '@sudoku/game';

    $: hintsAvailable = $hints > 0;


    function handleUndo() {
		userGrid.undo(candidates);
	}

	function handleRedo() {
		userGrid.redo(candidates);
	}

    function getCleanUserGrid(userGrid, invalidCells) {
      const cleanGrid = userGrid.map(row => [...row]);
      for (const cell of invalidCells) {
        const [x, y] = cell.split(',').map(Number);
        cleanGrid[y][x] = 0;
      }
      return cleanGrid;
    }

    function handleHint() {
        if (!hintsAvailable) return;
        try {
            const userGridData = [...$userGrid];
            let hint;

            // 新增：净化 userGrid，避免错误答案影响提示
            const cleanGrid = getCleanUserGrid(userGridData, $invalidCells);

            hint = findNextHint(cleanGrid, null, null);
            
            if (hint) {
                // 移动光标到提示的格子
                cursor.set(hint.x, hint.y);

                if (hint.candidates && hint.candidates.length > 1) {
                    // 记录分支点
                    backtrack.recordBranch(
                        {x: hint.x, y: hint.y},
                        hint.candidates.filter(c => c !== 0), // 过滤掉0
                        null,
                        hint.explanation // 保存提示说明
                    );

                    modal.show('backtrackSelect', {
                        position: {x: hint.x, y: hint.y},
                        candidates: hint.candidates.filter(c => c !== 0),
                        explanation: hint.explanation
                    });
                } else {
                    // 如果有确定答案
                    if (hint.value !== null && hint.value !== undefined) {
                        // 填入答案
                        userGrid.set({x: hint.x, y: hint.y}, hint.value);
                        
                        // 延迟检测，确保store已更新
                        setTimeout(() => {
                            checkGameWin($userGrid, $invalidCells, $wrongCells);
                        }, 0);
                        
                        // 显示策略提示
                        modal.show('confirm', {
                            title: strategies[hint.strategy]?.name || "Hint",
                            text: hint.explanation,
                            button: "Sure"
                        });
                    } else {
                        // 有多个候选值，显示提示但不自动填入
                        if (hint.candidates && hint.candidates.length > 0) {
                            // 构建友好的提示信息
                            let notesTip = "";
                            if (!$notes) {
                                notesTip = "You can click the notes button ✏️ at the bottom right, then enter these numbers to mark candidates.";
                            } else {
                                notesTip = "Notes mode is ON ✅, you can directly enter these numbers to mark candidates.";
                            }

                            modal.show('confirm', {
                                title: "Cannot determine the answer for this cell 🤔",
                                text: `Candidates for row ${hint.y + 1}, column ${hint.x + 1}: ${hint.candidates.join(', ')}\n\n${hint.explanation}\n\n${notesTip}`,
                                button: "Sure"
                            });
                        } else {
                            modal.show('confirm', {
                                title: "Hint",
                                text: "No candidates available for this cell.",
                                button: "OK"
                            });
                            return;
                        }
                    }
                }
            } else {
                modal.show('confirm', {
                    title: "Hint",
                    text: "No cell available for hint.",
                    button: "OK"
                });
                return;
            }

            // 消耗一个提示次数
            hints.use();
        } catch (error) {
            console.error("Hint error:", error);
            modal.show('confirm', {
                title: "Hint Error ⚠️",
                text: `An error occurred while providing a hint: ${error.message || "Please try again later"}`,
                button: "OK"
            });
        }
    }

    function handleBacktrack() {
        if ($gamePaused) return;

        const currentBranch = $backtrack.currentBranch;
        if (!currentBranch) {
            modal.show('confirm', {
                title: "Backtrack",
                text: "No available backtrack point.",
                button: "OK"
            });
            return;
        }

        const branch = $backtrack.branchPoints[currentBranch];
        modal.show('backtrackSelect', {
            position: branch.position
        });
    }

    function handleClearCreator() {
		modal.show('confirm', {
			title: 'Clear Board',
			text: 'Are you sure you want to clear all numbers? This cannot be undone.',
			button: 'Clear',
			callback: () => {
				userGrid.setGrid(Array(9).fill().map(() => Array(9).fill(0)));
			}
		});
	}
	

	function handleFinishCreator() {
		const currentUserGrid = get(userGrid);
		// 1. 检查已填数字数量
		const filledCount = currentUserGrid.flat().filter(n => n > 0).length;
		if (filledCount < 17) {
			modal.show('confirm', {
				title: 'Too Few Clues',
				text: 'A valid Sudoku puzzle must have at least 17 filled cells to ensure a unique solution. Please add more clues.',
				button: 'Continue',
				hideCancel: true,
				callback: () => {},
				secondary: {
					text: 'New Game',
					action: () => { location.reload(); }
				}
			});
			return;
		}

		// 2. 检查是否有冲突
		const invalid = get(invalidCells);
		if (invalid.length > 0) {
			modal.show('confirm', {
				title: 'Conflict Detected',
				text: 'There are conflicts in your Sudoku (duplicate numbers in row, column, or box).',
				button: 'Continue',
				hideCancel: true,
				callback: () => {},
				secondary: {
					text: 'New Game',
					action: () => { location.reload(); }
				}
			});
			return;
		}

		// 3. 检查是否有解且唯一
		const flatGrid = currentUserGrid.flat();
		const puzzleString = flatGrid.map(n => n === 0 ? '0' : n).join('');
		const solutionCount = countSolutions(puzzleString, 2);
		if (solutionCount === 0) {
			modal.show('confirm', {
				title: 'No Solution',
				text: 'The current Sudoku has no solution. Please check your puzzle.',
				button: 'Continue',
				hideCancel: true,
				callback: () => {},
				secondary: {
					text: 'New Game',
					action: () => { location.reload(); }
				}
			});
			return;
		}
		if (solutionCount > 1) {
			modal.show('confirm', {
				title: 'Multiple Solutions',
				text: 'The current Sudoku has multiple solutions. Please make sure your puzzle has a unique solution.',
				button: 'Continue',
				hideCancel: true,
				callback: () => {},
				secondary: {
					text: 'New Game',
					action: () => { location.reload(); }
				}
			});
			return;
		}

		// 校验全部通过，弹出原有确认弹窗
		modal.show('confirm', {
			title: 'Finish Create',
			text: 'Exit Creator Mode and Start Game?',
			button: 'Continue',
			callback: () => {
				game.finishCreatorMode();
			}
		});
	}

    function countSolutions(puzzleString, maxCount = 2) {
        let count = 0;
        const size = 9;
        const grid = puzzleString.split('').map(Number);

        function isValid(grid, idx, val) {
            const row = Math.floor(idx / size);
            const col = idx % size;
            // 检查行
            for (let i = 0; i < size; i++) {
                if (grid[row * size + i] === val) return false;
            }
            // 检查列
            for (let i = 0; i < size; i++) {
                if (grid[i * size + col] === val) return false;
            }
            // 检查宫
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (grid[(boxRow + i) * size + (boxCol + j)] === val) return false;
                }
            }
            return true;
        }

        function dfs(idx) {
            if (count >= maxCount) return;
            while (idx < 81 && grid[idx] !== 0) idx++;
            if (idx === 81) {
                count++;
                return;
            }
            for (let n = 1; n <= 9; n++) {
                if (isValid(grid, idx, n)) {
                    grid[idx] = n;
                    dfs(idx + 1);
                    if (count >= maxCount) return;
                    grid[idx] = 0;
                }
            }
        }

        dfs(0);
        return count;
    }

</script>

<div class="action-buttons space-x-3">

    <button
        class="btn btn-round"
        disabled={$gamePaused || $gameMode === GAME_MODES.CREATE}
        on:click={handleBacktrack}
        title="Backtrack">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a10 10 0 1 1 -2 4 m2 -4 l6 2m-6-2l2 -6"/>
        </svg>
    </button>

    <button
      class="btn btn-round"
      disabled={$gamePaused || $gameMode === GAME_MODES.CREATE}
      on:click={handleUndo}
      title="Undo">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    </button>

    <button
      class="btn btn-round"
      disabled={$gamePaused || $gameMode === GAME_MODES.CREATE}
      on:click={handleRedo}
      title="Redo">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
    </button>

    <button class="btn btn-round btn-badge" disabled={$gamePaused || !hintsAvailable || $gameMode === GAME_MODES.CREATE} on:click={handleHint} title="Hint">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>

		{#if $settings.hintsLimited}
            <span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
        {/if}
    </button>

	<button class="btn btn-round btn-badge" on:click={$gameMode === GAME_MODES.CREATE ? undefined : notes.toggle} disabled={$gameMode === GAME_MODES.CREATE} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>

		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>

    {#if $gameMode === GAME_MODES.CREATE}
        <button class="btn btn-round btn-badge mr-2" on:click={handleClearCreator} title="Clear Board">
            <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="badge">Clear</span>
        </button>
        <button class="btn btn-round btn-badge" on:click={handleFinishCreator} title="Finish Creating">
            <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>

            <span class="badge">Finish</span>
        </button>
    {/if}

</div>


<style>
	.action-buttons {
        @apply flex flex-wrap justify-evenly self-end;
    }
    .btn-badge {
        @apply relative;
    }
    .badge {
        min-height: 20px;
        min-width:  20px;
        @apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
    }
    .badge-primary {
        @apply bg-primary;
    }
</style>