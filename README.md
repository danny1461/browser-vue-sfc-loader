# Browser Vue SFC Loader

This minimal library allows importing *.vue files directly from your frontend JS. Supports templates, single script tag with further imports, and multiple style tags. Scoped styles should work as intended. `<script setup>` is unsupported; this would require a much more powerful parsing library.

Simply subsitute:
```js
import MyComponent from '/path/to/my-component.vue';
```
With:
```js
import importVue from '/path/to/importVue.min.js';
const MyComponent = await importVue('/path/to/my-component.vue');
```

Technically, importVue registers itself globally on the window object so you really only need to import it once at the top level scripts.

To slightly improve on the above example, it is recommended wrap the import in Vue's `defineAsyncComponent` to allow delayed importing only when the component is actually rendered.

```js
import { defineAsyncComponent } from 'vue';
const MyComponent = defineAsyncComponent(() => importVue('/path/to/my-component.vue'));
```