<template>
	<div style="padding: 10px 200px">
		<Scroller
			height="400px"
			:always="true"
			:native="false"
			style="background: gray; padding: 0 10px"
		>
			<Customer :render="renderItems" :length="5" id="anchor-0" />
			<Affix :fixed="false" :offset="30">
				<Tabs :model-value="0" style="background: white">
					<TabsPane label="1" anchor="#anchor-1" />
					<TabsPane label="2" anchor="#anchor-2" />
				</Tabs>
			</Affix>
			<Customer :render="renderItems" id="anchor-1"/>
			<Customer :render="renderItems" id="anchor-2" />
		</Scroller>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Scroller } from '../../scroller';
import { Customer } from '../../customer';
import { Affix } from '../../affix';
import { Tabs, TabsPane } from '..';

const renderItems = ({ length, id }) => Array.from({ length: length || 100 }).map((_, index) => h('p', { id }, `${id} - ${index}`));
</script>
