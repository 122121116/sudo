<script>
	import { onMount } from 'svelte';
	import game from '@sudoku/game';
	import { validateSencode } from '@sudoku/sencode';
	import { modal } from '@sudoku/stores/modal';
	import { slide, fade } from 'svelte/transition';
	import { DIFFICULTIES, DROPDOWN_DURATION, DIFFICULTY_CUSTOM } from '@sudoku/constants';
	import { difficulty } from '@sudoku/stores/difficulty';

	let allExamples = {};
	let exampleNames = [];
	let selectedExampleName = '';

	onMount(async () => {
		const res = await fetch('/all_sudoku_examples.json');
		allExamples = await res.json();
		exampleNames = Object.keys(allExamples);
	});

	let dropdownVisible = false;

	function handleDifficulty(difficultyValue) {
		dropdownVisible = false;
		game.pause();

		modal.show('confirm', {
			title: 'New Game',
			text: 'Start new game with difficulty "' + DIFFICULTIES[difficultyValue] + '"?',
			button: 'Continue',
			onHide: game.resume,
			callback: () => {
				game.startNew(difficultyValue);
			},
		});
	}

	function handleCreateOwn() {
		dropdownVisible = false;
		game.pause();

		modal.show('confirm', {
			title: 'Create Own',
			text: 'Switch to the creator mode to create your own Sudoku puzzle?',
			button: 'Continue',
			onHide: game.resume,
			callback: () => {
				//game.startCreatorMode();
			},
		});
	}

	function handleEnterCode() {
		dropdownVisible = false;
		game.pause();

		modal.show('prompt', {
			title: 'Enter Code',
			text: 'Please enter the code of the Sudoku puzzle you want to play:',
			fontMono: true,
			button: 'Start',
			onHide: game.resume,
			callback: (value) => {
				game.startCustom(value);
			},
			validate: validateSencode
		});
	}

	async function handleSudokuWeb() {
		dropdownVisible = false;
		game.pause();

		// 等待数据加载
		if (exampleNames.length === 0) {
			modal.show('confirm', {
				title: 'Loading',
				text: 'Loading, please wait...',
				button: 'Sure',
				onHide: game.resume
			});
			return;
		}

		// 弹窗下拉菜单选择题目
		let selected = null;
		await new Promise((resolve) => {
			modal.show('prompt', {
				title: 'Select sudoku',
				text: 'select one you like',
				options: exampleNames, // 传递选项
				button: 'Sure',
				onHide: game.resume,
				callback: (value) => {
					selected = value;
					resolve();
				}
			});
		});
		if (!selected) return;

		try {
			await game.getFromWeb(selected);
			// 不再弹窗，直接显示选中的题目
			dropdownVisible = false;
			selectedExampleName = selected;
			difficulty.setCustom();
			
		} catch (error) {
			modal.show('confirm', {
				title: 'Fail',
				text: `fail to get sudoku:${error.message}`,
				button: 'Sure',
				onHide: game.resume
			});
		}
	}

	function showDropdown() {
		dropdownVisible = true;
		game.pause();
	}

	function hideDropdown() {
		dropdownVisible = false;
		setTimeout(game.resume, DROPDOWN_DURATION);
	}
</script>

<div class="dropdown">
	<button class="dropdown-button" on:click={dropdownVisible ? hideDropdown : showDropdown} title="{dropdownVisible ? 'Close' : 'Open'} Menu">
		<svg class="icon-outline mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h12" />
		</svg>

		<span class="text-2xl tracking-wider">{$difficulty === DIFFICULTY_CUSTOM ? 'Custom' : DIFFICULTIES[$difficulty]}</span>
	</button>

	{#if dropdownVisible}
		<button transition:fade={{duration: DROPDOWN_DURATION}} class="dropdown-overlay" on:click={hideDropdown} tabindex="-1"></button>

		<div transition:slide={{duration: DROPDOWN_DURATION}} class="dropdown-menu">
			{#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}
				<a class="dropdown-item" on:click|preventDefault={() => handleDifficulty(difficultyValue)} href="/difficulty-{difficultyValue}" title="Set difficulty to '{difficultyLabel}'">
					<svg class="icon-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
					</svg>

					<span class="align-middle">{difficultyLabel}</span>
				</a>
			{/each}

			<hr class="my-1">

			<a class="dropdown-item" on:click|preventDefault={handleCreateOwn} href="/create" title="Create your own Sudoku puzzle">
				<svg class="icon-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
				</svg>

				<span class="align-middle">Create Own</span>
			</a>
			<a class="dropdown-item" on:click|preventDefault={handleEnterCode} href="/enter-code" title="Enter a Sudoku puzzle code from a friend">
				<svg class="icon-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
					<path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
					<path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
				</svg>

				<span class="align-middle">Enter Code</span>
			</a>
			<a class="dropdown-item" on:click|preventDefault={handleSudokuWeb} href="#" title="Get Sudoku from Lib">
				<svg class="icon-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
					<path d="M12 4v1H8V4a4 4 0 018 0v1a4 4 0 01-8 0z" />
					<path fill-rule="evenodd" d="M4 8a4 4 0 014-4h4a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8zm4-2a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2H8z" clip-rule="evenodd" />
				</svg>
				<span class="align-middle">Get from Web</span>
			</a>
		</div>
	{/if}

	{#if $difficulty === DIFFICULTY_CUSTOM}
		<div>Select: {selectedExampleName}</div>
	{/if}
</div>

<style>
	.dropdown {
		@apply relative;
	}

	.dropdown-button {
		@apply relative z-30 block flex outline-none items-center;
	}

	.dropdown-overlay {
		@apply fixed z-20 inset-0 h-full w-full bg-black bg-opacity-50 outline-none cursor-default;
	}

	.dropdown-menu {
		@apply absolute z-30 left-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl;
	}


	.dropdown-item {
		@apply block px-4 py-2 text-gray-800 transition-colors duration-100 text-lg tracking-wide font-semibold;
	}

	.dropdown-item:hover {
		@apply bg-primary text-white;
	}

	.dropdown-item:active {
		@apply bg-primary-dark;
	}
</style>