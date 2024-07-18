<template>
	<p>The content for this modal is coming from an entirely separate *.vue file. The sky is really the limit</p>
	<div class="d-flex justify-content-between">
		<Button label="That's nice" @click="dialogRef.close(`That's nice`)" severity="secondary" />
		<Button label="Ok" @click="dialogRef.close('Ok')" severity="primary" />
	</div>
</template>

<script>
// Vue file built with composition API
import { inject } from "vue";

export default {
	// inject: ['dialogRef'], // Injecting with Options API
	setup() {
		const dialogRef = inject('dialogRef');

		return {
			dialogRef
		};
	}
}
</script>