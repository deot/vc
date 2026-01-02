<template>
	<div style="display: flex; flex-direction: column; gap: 10px;">
		<Counter :value="current" :precision="2" />
		<Counter :value="9999.90" :precision="2" />
		<Counter value="9999.90" :precision="2" zeroless />
		<Counter :value="toDefine" placeholder="value(undefined2define)" @click="toDefine = 999999"/>
		<Counter :value="null" placeholder="value(null)"/>
		<Counter :value="``" placeholder="value('')"/>
		<Counter :value="`abcd`" placeholder="value(abcd)"/>
		<Counter placeholder="value(undefined)"/>
		<div style="display: flex; gap: 10px;">
			<button @click="counter.start()">start</button>
			<button @click="counter.pause()">pause</button>
			<button @click="counter.resume()">resume</button>
			<button @click="counter.end()">end</button>
			<button @click="counter.restart()">restart</button>
			<button @click="counter.print(10002)">print</button>
			<button @click="handleUpdate">update</button>
		</div>
		{{  print }}
		<Counter
			ref="counter"
			:value="9999.90"
			:duration="5000"
			controllable
			@begin="console.log('begin')"
			@change="print = $event"
			@complete="console.log('complete')"
		/>
	</div>
</template>
<script setup>
import { Counter } from '..';
import { ref } from 'vue';

const current = ref(6666);
const toDefine = ref();
const counter = ref();
const print = ref();

const handleUpdate = () => {
	toDefine.value = 999999;
	current.value = 999999;
	counter.value.update(999999);
};
</script>
