<script>
	export let data = {};
	export let hideModal;

	let value = '';

	function handleButton() {
		if (data.callback) data.callback(value);
		hideModal();
	}
</script>

<h1 class="text-3xl font-semibold mb-5 leading-none">{data.title || 'Please enter something'}</h1>

{#if data.text}
	<label for="prompt-input" class="text-lg mb-4">{data.text}</label>
{/if}

{#if data.options}
	<select class="input mb-5" id="prompt-select" bind:value>
		<option value="" disabled selected>Please Select</option>
		{#each data.options as option}
			<option value={option}>{option}</option>
		{/each}
	</select>
{:else}
	<input class="input mb-5" id="prompt-input" name="prompt-input" class:font-mono={data.fontMono} bind:value type="text">
{/if}

<div class="flex justify-end">
	<button class="btn btn-small mr-3" on:click={hideModal}>Cancel</button>
	<button class="btn btn-small btn-primary" disabled={data.validate ? !data.validate(value) : false} on:click={handleButton}>{data.button || 'Okay'}</button>
</div>