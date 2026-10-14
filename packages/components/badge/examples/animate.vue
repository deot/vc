<template>
	<div class="badge-demo">
		<p>dot 切换：显示与隐藏时缩放进出场</p>
		<div class="badge-demo__row">
			<Badge :dot="dot" :value="dot ? count : 0">
				<span class="badge-demo__box" />
			</Badge>
			<Switch v-model="dot" />
		</div>

		<p>value 变化：数字改变时缩放；减到 0 时离场，再从 0 增加时进场</p>
		<div class="badge-demo__row">
			<Badge :value="count">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="count" :max="10">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="count" />
			<div class="badge-demo__actions">
				<Button @click="count++">+1</Button>
				<Button @click="count = Math.max(count - 1, 0)">-1</Button>
				<Button @click="count += 100">+100</Button>
				<Button @click="count = 0">清零</Button>
				<span>value：{{ count }}</span>
			</div>
		</div>

		<p>形态切换：dot / value / 文字 / 自定义之间切换</p>
		<div class="badge-demo__row">
			<Badge v-bind="TYPES[type]">
				<span class="badge-demo__box" />
				<template v-if="type === 'custom'" #dot>
					<Icon type="time" />
				</template>
			</Badge>
			<Select v-model="type" :data="TYPE_OPTIONS" style="width: 160px;" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Badge } from '..';
import { Button } from '../../button';
import { Icon } from '../../icon';
import { Select } from '../../select';
import { Switch } from '../../switch';

const dot = ref(true);
const count = ref(12);

const TYPES = {
	dot: { dot: true },
	value: { value: 12 },
	text: { value: 'NEW' },
	custom: { dotStyle: { width: '16px', height: '16px', fontSize: '14px' } },
	none: {}
};
const TYPE_OPTIONS = Object.keys(TYPES).map(value => ({ label: value, value }));
const type = ref('value');
</script>
<style>
.badge-demo {
	padding: 20px;
	background: var(--vc-background-color-lightest);
}

.badge-demo__row {
	display: flex;
	align-items: center;
	gap: 40px;
	margin-bottom: 24px;
}

.badge-demo__actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.badge-demo__box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
