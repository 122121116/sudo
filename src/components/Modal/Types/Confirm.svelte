<script>
	export let data = {};
	export let hideModal;

	function handleContinue() {
		if (data.callback) data.callback();
		hideModal();
	}
</script>

<h1 class="text-3xl font-semibold mb-5 leading-none">{data.title || 'Confirm'}</h1>

{#if data.text}
	<p class="text-lg mb-5">{data.text}</p>
{/if}

<div class="flex justify-end">
	{#if !data.hideCancel}
		<button class="btn btn-small mr-3" on:click={hideModal}>Cancel</button>
	{/if}
	<button class="btn btn-small btn-primary mr-3" on:click={handleContinue}>{data.button || 'Okay'}</button>
	{#if data.secondary}
		<button class="btn btn-small btn-primary" on:click={() => { data.secondary.action(); hideModal(); }}>{data.secondary.text}</button>
	{/if}
</div>