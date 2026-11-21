<template>
	<div class="v-intersection-list">
		<div class="_bar">
			<span>已曝光：{{ exposed.size }} / {{ data.length }}</span>
			<Button @click="reset">
				重置
			</Button>
		</div>
		<p>每项 threshold 0.5、once：露出一半时记一次曝光；{{ data.length }} 项共用一个 IntersectionObserver</p>
		<Scroller height="400px" class="_box">
			<Intersection
				v-for="item in data"
				:key="`${version}-${item}`"
				:threshold="0.5"
				once
				class="_item"
				:class="{ 'is-exposed': exposed.has(item) }"
				@change="handleChange(item, $event)"
			>
				条目 {{ item }}
			</Intersection>
		</Scroller>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Intersection } from '..';
import { Button } from '../../button';
import { Scroller } from '../../scroller';

const data = Array.from({ length: 500 }, (_, index) => index + 1);
const exposed = reactive(new Set());
const version = ref(0);

const handleChange = (item, { visible }) => {
	if (!visible) return;
	exposed.add(item);
};

const reset = () => {
	exposed.clear();
	version.value++;
};
</script>
<style>
.v-intersection-list { padding: 20px; }

.v-intersection-list ._bar {
	display: flex;
	gap: 12px;
	align-items: center;
}

.v-intersection-list ._box {
	width: 320px;
	background: var(--vc-color-light-deeper);
}

.v-intersection-list ._item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-border-color);
	transition: background .3s;
}

.v-intersection-list ._item.is-exposed { background: var(--vc-background-color-primary-light); }
</style>
