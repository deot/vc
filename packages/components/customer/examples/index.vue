<template>
	<h2>v3新增默认语法：可不使用组件</h2>
	<component 
		:is="renderHeader" 
		:value="value"
		class="v-customer-basic"
		@click="handleClick"
		@customer-click="hadnleCustomerClick"
	>
		<template #default>
			default: <span>v3</span>
		</template>
		<template #content="{ info }">
			content: {{ info }}
		</template>
	</component>
	<h2>仅语义化: Customer </h2>
	<Customer 
		:render="renderHeader" 
		:value="value"
		class="v-customer-basic"
		@click="handleClick"
		@customer-click="hadnleCustomerClick"
	>
		<template #default>
			default: <span>Customer</span>
		</template>
		<template #content="{ info }">
			{{ info }}: Customer 
		</template>
	</Customer>
</template>

<script lang="jsx" setup>
import { ref } from 'vue';
import { Customer } from '..';

const value = ref('Hello World!');
const renderHeader = ($props, { attrs, slots, emit }) => {
	return (
		<ul class="g-flex-cc" onClick={(e) => emit('customer-click', e)}>
			<li>实时响应：{ attrs.value }</li> 
			<li>实时响应：{ $props?.value }</li> 
			<li>实时响应{ value.value }</li> 
			<li>插槽default { slots.default() }</li> 
			<li>插槽content { slots.content({ info: "content" }) }</li> 
		</ul>
	);
};
const handleClick = (e) => {
	value.value += '!';
};

const hadnleCustomerClick = (e) => {
	console.log(e);
};
</script>
<style>
.v-customer-basic span {
	color: red;
}
</style>
