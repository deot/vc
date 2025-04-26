<template>
	<div style="padding: 100px">
		<h3 v-if="!isGroup" @click="handleClick">
			点击触发: {{ isVisible }}
		</h3>
		<template v-else-if="isGroup">
			<h3 @click="handleAdd">
				添加: {{ colors.length }}
			</h3>
			<h3 @click="handleDel">
				删除: {{ colors.length }}
			</h3>
		</template>

		<h3 @click="handleGroup">
			切换为组合: {{ isGroup }}
		</h3>
		<div style="display: flex; align-items: center">
			<select v-model="transitionName">
				<option
					v-for="item in transitionOptions"
					:key="item"
					v-text="item"
				/>
			</select>
			<select v-if="transitionName === 'slide'" v-model="slideModeName">
				<option
					v-for="item in slideModeOptions"
					:key="item"
					v-text="item"
				/>
			</select>
			<select v-if="transitionName === 'scale'" v-model="scaleModeName">
				<option
					v-for="item in scaleModeOptions"
					:key="item"
					v-text="item"
				/>
			</select>
			<select v-if="transitionName === 'zoom'" v-model="zoomModeName">
				<option
					v-for="item in zoomModeOptions"
					:key="item"
					v-text="item"
				/>
			</select>
		</div>
		<div v-if="!isGroup">
			<component
				:is="wrapper"
				:mode="mode"
				:appear="true"
				data-x="123"
				style="color: red!important"
				@before-enter="handleEnter"
			>
				<div v-show="isVisible" style="background: var(--vc-foreground-color); color: var(--vc-background-color)">
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
					<p>test</p>
				</div>
			</component>
		</div>
		<div v-else>
			<component
				:is="wrapper"
				:mode="mode"
				group
				tag="div"
				style="display: flex; flex-wrap: wrap"
				@before-enter="handleEnter"
			>
				<div
					v-for="(item, index) in colors"
					:key="item.id"
					:style="{ background: item.color }"
					style="width: 48px; line-height: 4; color: #e6e6e6; margin: 10px"
				>
					{{ index }}: {{ item.id }}
				</div>
			</component>
		</div>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import {
	Transition as VTransition,
	TransitionFade,
	TransitionScale,
	TransitionSlide,
	TransitionZoom,
	TransitionCollapse
} from '..';

let count = 0;

const isVisible = ref(true);
const isGroup = ref(true);
const transitionName = ref('fade');
const transitionOptions = ref([
	'fade',
	'scale',
	'slide',
	'zoom',
	'collapse',
	'custom'
]);
const slideModeName = ref('left-part');
const slideModeOptions = ref(['left-part', 'right-part', 'top-part', 'bottom-part', 'left', 'right', 'top', 'bottom']);
const zoomModeName = ref('x');
const zoomModeOptions = ref(['x', 'y', 'center']);

const scaleModeName = ref('both');
const scaleModeOptions = ref(['both', 'part']);

const color = () => {
	const fn = () => Math.floor(Math.random() * 256);
	return `rgba(${fn()}, ${fn()}, ${fn()})`;
};

const colors = ref(Array.from({ length: 5 }, () => ({ id: count++, color: color() })));

const mode = computed(() => {
	switch (transitionName.value) {
		case 'scale':
			return scaleModeName.value;
		case 'slide':
			return slideModeName.value;
		case 'zoom':
			return zoomModeName.value;
		default:
			return '';
	}
});

const wrapper = computed(() => {
	switch (transitionName.value) {
		case 'scale':
			return TransitionScale;
		case 'slide':
			return TransitionSlide;
		case 'zoom':
			return TransitionZoom;
		case 'collapse':
			return TransitionCollapse;
		case 'fade':
			return TransitionFade;
		case 'custom':
			return VTransition;
		default:
			return '';
	}
});
const handleEnter = (el) => {
	console.dir(el);
};
const handleClick = () => {
	isVisible.value = !isVisible.value;
};

const handleGroup = () => {
	isGroup.value = !isGroup.value;
};
const handleAdd = () => {
	colors.value.push({ id: count++, color: color() });
};
const handleDel = () => {
	const index = Math.floor(Math.random() * colors.value.length);
	colors.value.splice(index, 1);
	console.log(`remove ${index}`);
};
</script>
