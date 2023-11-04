<template>
	<button @click="handleClickBasic">
		BASIC: { multiple: false }
	</button>
	<br>
	<button @click="handleClickMultiple">
		BASIC: { multiple: true }
	</button>

	<PortalView>
		<div>placeholder</div>
		<template #content>
			<p>{{ date }}</p>
			<p>{{ random }}</p>
		</template>
	</PortalView>
	<PortalView>
		<template #content>
			<p>{{ date }}</p>
			<p>{{ random }}</p>
		</template>
	</PortalView>
</template>
<script setup>
import { ref } from 'vue';
import { random as _random } from 'lodash-es';
import { Modal } from './popup';
import { PortalView } from '..';

const date = ref();
const random = ref();

setInterval(() => {
	date.value = new Date();
	random.value = _random(1, 10000);
}, 1000);

const handleClickBasic = async () => {
	try {
		const e = await Modal.popup({ 
			leaveDelay: 0,
			title: `Hello world - ${Math.random()}`
		});
		console.log(`${e.status}: ${e.title}`);
	} catch (e) {
		console.log(`${e.status}: ${e.title}`);
	}
};

const handleClickMultiple = async () => {
	try {
		const e = await Modal.popup({ 
			leaveDelay: 0,
			multiple: true,
			title: `Hello world - ${Math.random()}`
		});
		console.log(`${e.status}: ${e.title}`);
	} catch (e) {
		console.log(`${e.status}: ${e.title}`);
	}
};
</script>
