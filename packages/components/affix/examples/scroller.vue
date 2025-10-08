<template>
	<Customer :render="renderItems" />
	<div style="padding: 10px 200px">
		<Scroller
			height="200px"
			:always="true"
			:native="false"
			style="background: gray; padding: 10px"
		>
			<Customer :render="renderItems" :length="2" />
			<Affix :fixed="false" :offset="10">
				<Button type="error">1. Top(Scroller)</Button>
			</Affix>
			<Customer :render="renderItems" />
			<Affix :fixed="false" :offset="10" placement="bottom">
				<Button type="error">1. Bottom(Scroller)</Button>
			</Affix>
			<Customer :render="renderItems" />
		</Scroller>
	</div>
	<div v-if="false" style="padding: 10px 200px">
		<ScrollerWheel
			height="200px"
			:always="true"
			:native="false"
			style="background: gray"
		>
			<Customer :render="renderItems" :length="2" />
			<Affix :fixed="false" :offset="10">
				<Button type="error">2. Top(ScrollerWheel)</Button>
			</Affix>
			<Customer :render="renderItems" />
			<Affix :fixed="false" :offset="10" placement="bottom">
				<Button type="error">2. Bottom(ScrollerWheel)</Button>
			</Affix>
		</ScrollerWheel>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Scroller, ScrollerWheel } from '../../scroller';
import { Button } from '../../button';
import { Customer } from '../../customer';
import { Affix } from '..';

const renderItems = ({ length }) => Array.from({ length: length || 10 }).map((_, index) => h('p', index));
</script>
