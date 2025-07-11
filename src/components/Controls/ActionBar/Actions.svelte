<script>
	import { candidates } from '@sudoku/stores/candidates';
	import { userGrid, invalidCells } from '@sudoku/stores/grid';
	import { cursor } from '@sudoku/stores/cursor';
	import { hints } from '@sudoku/stores/hints';
	import { notes } from '@sudoku/stores/notes';
	import { settings } from '@sudoku/stores/settings';
	import { keyboardDisabled } from '@sudoku/stores/keyboard';
	import { gameMode } from '@sudoku/game';
	import { gamePaused } from '@sudoku/stores/game';
	import game from '@sudoku/game';
	import { GAME_MODES } from '@sudoku/constants';
	import { modal } from '@sudoku/stores/modal'
	import { get } from 'svelte/store';
	import solve from '@mattflow/sudoku-solver';
	
	$: hintsAvailable = $hints > 0;

	function handleHint() {
		if (hintsAvailable) {
			if ($candidates.hasOwnProperty($cursor.x + ',' + $cursor.y)) {
				candidates.clear($cursor);
			}
			
			userGrid.applyHint($cursor);
		}
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
		// 用@mattflow/sudoku-solver检测唯一解
		const flatGrid = currentUserGrid.flat();
		const puzzleString = flatGrid.map(n => n === 0 ? '.' : n).join('');
		let solutionCount = 0;
		let firstSolution = null;
		try {
			// 第一次求解，获得一个解
			const sol1 = solve(puzzleString, { outputArray: true, hintCheck: false });
			if (!sol1 || sol1.length !== 81) {
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
			firstSolution = sol1;
			solutionCount = 1;
			// 尝试找到第二个不同的解
			// 找到第一个空格，尝试填入不同于第一个解的数字
			for (let i = 0; i < 81; i++) {
				if (flatGrid[i] === 0) {
					for (let n = 1; n <= 9; n++) {
						if (n !== sol1[i]) {
							const alt = [...flatGrid];
							alt[i] = n;
							const altString = alt.map(x => x === 0 ? '.' : x).join('');
							const sol2 = solve(altString, { outputArray: true, hintCheck: false });
							if (sol2 && sol2.length === 81) {
								// 找到第二个解
								solutionCount = 2;
								break;
							}
						}
					}
					break;
				}
			}
		} catch (e) {
			solutionCount = 0;
		}
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


</script>

<div class="action-buttons space-x-3">

	<button class="btn btn-round" disabled={$gamePaused} title="Undo">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button class="btn btn-round" disabled={$gamePaused} title="Redo">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable || $userGrid[$cursor.y][$cursor.x] !== 0 || $gameMode === GAME_MODES.CREATE} on:click={handleHint} title="Hints ({$hints})">
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

</style>