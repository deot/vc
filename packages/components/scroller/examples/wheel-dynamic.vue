<template>
	<div style="padding: 20px">
		<h1 @click="always = !always">
			always: {{ always }}
		</h1>
		<h1 @click="native = !native">
			native: {{ native }}
		</h1>
		<div>
			<h1>Count: {{ count }}</h1>
			<h2 @click="count++">
				+
			</h2>
			<h2 @click="count--">
				-
			</h2>
			<h2 @click="count *= 10">
				*
			</h2>
			<h2 @click="count /= 10">
				/
			</h2>
		</div>
		<ScrollerWheel
			ref="scroller"
			height="200px"
			:always="always"
			:native="native"
			@scroll="handleScrollDelegate"
		>
			<p
				v-for="item in count"
				:key="item"
			>
				{{ item }}
			</p>
		</ScrollerWheel>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ScrollerWheel } from '..';

const always = ref(true);
const native = ref(false);
const count = ref(100);
const scroller = ref();

window.scroller = scroller;

const handleScrollDelegate = (e) => {
	// do ...
};
</script>

<style>
p {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 50px;
	margin: 10px 0px;
	text-align: center;
	border-radius: 4px;
	background: #ecf5ff;
	color: #409eff;
	width: 100%;
}

p.is-vertical {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100px;
	height: 50px;
	margin: 10px;
	text-align: center;
	border-radius: 4px;
	background: #fef0f0;
	color: #f56c6c;
}
</style>
