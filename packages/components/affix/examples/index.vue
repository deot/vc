<template>
	<h1>Fixed</h1>
	<Affix :offset="0">
		<Button type="error">0. Top(window)</Button>
	</Affix>
	<Customer :render="renderItems" />
	<div style="padding: 0 140px" class="no-scroller">
		<div style="height: 200px; background: gray;">
			<div>a</div>
			<Affix :offset="10" to=".no-scroller">
				<Button type="success">2. Top(NoScroller)</Button>
			</Affix>
			<div>b</div>
			<div>c</div>
			<div>d</div>
			<div>e</div>
			<Affix :offset="10" placement="bottom" to=".no-scroller">
				<Button type="success">2. Bottom(NoScroller)</Button>
			</Affix>
			<div>f</div>
		</div>
	</div>
	<Affix :offset="40">
		<Button type="primary">1. Top(window)</Button>
	</Affix>
	<Customer :render="renderItems" />
	<Affix :offset="40" placement="bottom">
		<Button type="primary">1. Bottom(window)</Button>
	</Affix>
	<Customer :render="renderItems" />
	<Affix :offset="0" placement="bottom">
		<Button type="error">0. Bottom(window)</Button>
	</Affix>
</template>
<script setup>
import { h } from 'vue';
import { Button } from '../../button';
import { Customer } from '../../customer';
import { Affix } from '..';

const renderItems = ({ length }) => Array.from({ length: length || 30 }).map((_, index) => h('p', index));
</script>
