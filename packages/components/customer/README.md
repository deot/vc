## 功能
自定义渲染组件，以参数形式传递

## 关联组件清单

## 基础用法

```vue
<template>
	<div>
		<Customer
			v-if="true"
			v-show="show"
			:render="renderRow"
			:value="value" 
			:date="date" 
			class="Customer"
			style="border: 1px solid red"
			name="time"
			after-text="----"
			@click-show="handleClick"
		/>

		<Customer :render="renderRow2">
			<div>test1</div>
			<div>test2</div>
			<template #test="it">
				{{ it }}
			</template>
		</Customer>
	</div>
</template>
<script setup lang="jsx">
import { ref, onUnmounted } from 'vue';
import { Customer } from '@deot/vc';

const show = ref(true);
const value = ref(1);
const date = ref(new Date());

const handleClick = () => {
	console.log('click');
	show.value = false;
};

const renderRow = (props) => {
	const { style, className, name, value, date, afterText, onClickShow } = props;

	return (
		<div class={className} style={style} onClick={onClickShow}>
			{date.toString()}:{name}:{value}{afterText}
		</div>
	);
};

const renderRow2 = (props, parent) => {
	return (
		<div>
			{ parent.slots.default() }
			{ parent.slots.test({ name: 'scopedSlots' }) }
		</div>
	);
};

const timer = setInterval(() => {
	value.value++;
	date.value = new Date();
	show.value = true;
}, 1000);

onUnmounted(() => clearInterval(timer));
</script>
```

## API