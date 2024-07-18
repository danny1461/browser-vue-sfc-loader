<template>
	<DynamicDialog />
	<Toast />

	<div class="container my-5">
		<h1>Demo</h1>
		<p>This demo is much bigger than it needs to be. It just to show that you don't have to constrain your non-bundled Vue apps if you don't want to.</p>
		<p>For simplicity, these examples are assuming you are putting your code into a <code>&lt;script type="module"&gt;</code>. Simply use the <strong>importVue</strong> helper to load and process Vue SFC components in the browser</p>
		<pre>
			import importVue from 'path/to/importVue.min.js';
			const MyComponent = await importVue('./path/to/my-component.vue');
			// Use MyComponent however you would any other Vue component

			// Optional but recommended to help with load times for delayed components
			import { defineAsyncComponent } from 'vue';
			const MyComponent = defineAsyncComponent(() => importVue('./path/to/my-component.vue'));
		</pre>
		<Button label="Open Custom Modal" severity="Info" @click="openDialog" />
		<p>This button has scoped styles applied directly to it:</p>
		<pre>
			button {
				width: 100%;
			}
		</pre>
		<p>But because they're scoped, they will only affect the buttons directly in <code>app.vue</code>. Other buttons are unaffected.</p>

		<h3 class="my-3">Data table example from <a href="https://primevue.org/datatable/#advanced_filter" target="_blank">PrimeVue</a></h3>
		<DataTableExample />
	</div>
</template>

<script>
// <script setup> is not supported because we don't have full parsing of JS to know what needs exporting
// Both options and composition API are supported however for composition you need to explicity define the setup function and return your exports
// https://vuejs.org/api/composition-api-setup.html#basic-usage

// ESM imports work within SFC files
import { defineAsyncComponent } from 'vue';

// Only PrimeVue Button has been registered globally in this demo. You can register globally or locally, it's your choice
import DynamicDialog from 'primevue/dynamicdialog';
import Toast from 'primevue/toast';

// Alternate import method but using await here forces the App component to delay loading until the modal component loads
// Using defineAsyncComponent allows us to delay loading the component until it's needed
// const CustomModal = await importVue('./custom-modal.vue');

// Again, all Vue SFC imports must go through importVue
const CustomModal = defineAsyncComponent(() => importVue('./custom-modal.vue'));

// Must export the component
export default {
	components: {
		DynamicDialog,
		Toast,
		DataTableExample: defineAsyncComponent(() => importVue('./data-table-example.vue'))
	},
	methods: {
		openDialog() {
			// https://primevue.org/dynamicdialog/#dialogservice
			this.$dialog.open(CustomModal, {
				props: {
					header: 'My Custom Modal',
					style: {
						width: '50vw'
					},
					modal: true
				},
				data: 'Some data from app.vue',
				onClose: ({ data }) => {
					this.$toast.add({
						severity: 'success',
						summary: 'Dialog Result',
						detail: data,
						life: 3000
					});
				}
			});
		}
	}
}
</script>

<!-- Non scoped styles (applies app wide) -->
<style>
	#app h1 {
		color: var(--bs-blue);
	}
</style>

<!-- Scoped styles (applies to this component only) -->
<style scoped>
	button {
		width: 100%;
	}
</style>