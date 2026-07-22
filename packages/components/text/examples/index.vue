<template>
	<div style=" width: 100%; padding: 20px;overflow: auto;">
		<Button @click="handleClick">
			切换行数
		</Button>
		<div :style="{ width: `50vw` }">
			<h3>line: {{ line0 }} </h3>
			<Text :value="text14" :line="line0" />
			<h3>line: {{ line1 }} </h3>
			<Text :value="text16" :line="line1" />
			<h3>line: {{ line2 }} </h3>
			<Text :value="text18" :line="line2" />
			<h3>line: {{ line3 }} </h3>
			<Text :value="text30" :line="line3" />

			<h3>slice = -5（保留尾部 5 字符，形如 abc...lmnop）</h3>
			<Text :value="text30" :line="2" :slice="-5" />
			<h3>slice = 0（省略号置首：'...' + 整串）</h3>
			<Text :value="text18" :line="2" :slice="0" />
			<h3>slice = -8 + 自定义 ellipsis</h3>
			<Text :value="text30" :line="2" :slice="-8" ellipsis=" ··· " />
		</div>
		<div style="width: 258px;">
			<div style="display: flex; align-items: center;">
				<div>
					<Text :value="` https://github.com?v=${'123'.repeat(10)}`" :line="1" />
				</div>
			</div>
		</div>
		<div style="width: 192px;">
			<div style="display: flex;">
				<div style="display: flex;">
					<span style="white-space: nowrap; ">占 位</span>
					<Text :value="`占位占位占位占位占位占位--占位占位`" :line="1" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Text } from '..';
import { Button } from '../../button';

const text = 'A2，C,我E,';
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
	position: relative;
	width: 100%;
	padding: 20px;
	overflow-x: auto;
	text-align: left;
	background: #fff;
	border-collapse: collapse;
	border-radius: 4px;
}

.table thead th {
	padding: 9px 15px;
	font-size: 14px;
	font-weight: 400;
	white-space: nowrap;
	vertical-align: middle;
	background: #f0f2f7;
}

.table tbody td {
	padding: 9px 15px;
	line-height: 22px;
	border-bottom: 1px solid #ebebeb !important;
}

.table tbody td::after {
	display: block;
	height: 0;
	clear: both;
	font-size: 0;
	content: "";
	visibility: hidden;
}

</style>
