<template>
	<div style="padding: 20px;">
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
		>
			<!-- 不使用v-for -->
			<Customer :render="renderList" :length="count" type="custom" />
			<!-- 使用V-for -->
			<p
				v-for="item in count"
				:key="item"
			>
				<Customer :render="renderItem" :index="item" type="vFor" />
			</p>
		</ScrollerWheel>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ScrollerWheel } from '..';
import { Customer } from '../../customer';

const always = ref(true);
const native = ref(false);
const count = ref(100);

const renderItem = (props) => {
	const { index, type } = props;
	console.log(`renderItem ${type}`, index);
	return <p>{ `${type} - ${index}` }</p>;
};

const renderList = (props) => {
	const { length, type } = props;
	console.log(`renderList ${type}`, length);
	return Array.from({ length }, (_, i) => i + 1).map(item => (
		<Customer key={item} render={renderItem} index={item} type={type} />
	));
};

</script>

<style>
p {
	display: flex;
	width: 100%;
	height: 50px;
	margin: 10px 0;
	color: #409eff;
	text-align: center;
	background: #ecf5ff;
	border-radius: 4px;
	align-items: center;
	justify-content: center;
}

p.is-vertical {
	display: flex;
	width: 100px;
	height: 50px;
	margin: 10px;
	color: #f56c6c;
	text-align: center;
	background: #fef0f0;
	border-radius: 4px;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
}
</style>
