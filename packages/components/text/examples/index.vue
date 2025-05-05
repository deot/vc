<template>
	<div style="overflow: auto; width: 100%; padding: 20px">
		<Button @click="handleClick">
			切换行数
		</Button>
		<div v-if="false" :style="{ width: width + 'px' }">
			<h3>line: {{ line0 }} </h3>
			<Text :value="text14" :line="line0" />
			<h3>line: {{ line1 }} </h3>
			<Text :value="text16" :line="line1" />
			<h3>line: {{ line2 }} </h3>
			<Text :value="text18" :line="line2" />
			<h3>line: {{ line3 }} </h3>
			<Text :value="text30" :line="line3" />
		</div>
		<Text :line="line3" :value="text30">
			{{ text30 }}
		</Text>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Text } from '..';
import { Button } from '../../button';

const text = 'A2，C,我E,';
// const dataSource = ref(Array.from({ length: 4 }).map(() => ({})));
const width = ref(window.innerWidth - 40);
// const maxWidth = ref(window.innerWidth - 40);
// const text10 = ref(text.repeat(10));
// const text12 = ref(text.repeat(12));
const text14 = ref(text.repeat(14));
const text16 = ref(text.repeat(16));
const text18 = ref(text.repeat(18) + 'REPEAT_END_18');
const text30 = ref(text.repeat(30) + 'REPEAT_END_30');
const line0 = ref(0);
const line1 = ref(1);
const line2 = ref(2);
const line3 = ref(3);

const handleClick = () => {
	if (line0.value === 0) {
		line0.value = 3;
		line1.value = 2;
		line2.value = 1;
		line3.value = 0;
	} else {
		line0.value = 0;
		line1.value = 1;
		line2.value = 2;
		line3.value = 3;
	}
};
</script>

<style lang="scss">
.table {
	overflow-x: auto;
	background: #fff;
	position: relative;
	padding: 20px;
	border-collapse: collapse;
	width: 100%;
	text-align: left;
	-webkit-border-radius: 4px;
	-moz-border-radius: 4px;
	border-radius: 4px
}

.table thead th {
	background: #f0f2f7;
	font-size: 14px;
	font-weight: 400;
	vertical-align: middle;
	white-space: nowrap;
	padding: 9px 15px
}

.table tbody td {
	line-height: 22px;
	padding: 9px 15px;
	border-bottom: 1px solid #ebebeb !important
}

.table tbody td:after {
	content: "";
	display: block;
	clear: both;
	height: 0;
	font-size: 0;
	visibility: hidden
}

</style>
