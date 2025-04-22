<template>
	<div>
		<MList :label-width="100" style="margin: 20px 0;">
			<MListItem :arrow="false" label="姓名">
				<template #label="">
					<div />
				</template>
				<template #extra="">
					<div>2</div>
				</template>
			</MListItem>
			<MListItem label="姓名" extra="啦啦啦" @click="handleCLick"/>
			<MListItem :arrow="false" label="姓名" extra="啦啦啦" />
		</MList>
		<MListItem :arrow="true" label="姓名">
			<template #extra="">
				<div>alone</div>
			</template>
		</MListItem>
		<br>
		<br>
		<br>
		<br>
		<!-- 鬼畜嵌套 -->
		<!-- <MForm>
			<MList :border="false">
				<MFormItem :indent="0">
					<MListItem :arrow="true" label="姓名">
						<template #label="">
							<div>鬼畜嵌套</div>
						</template>
					</MListItem>
				</MFormItem>
				<MFormItem :indent="0">
					<MListItem :arrow="true" label="姓名">
						<template #label="">
							<div>鬼畜嵌套</div>
						</template>
					</MListItem>
				</MFormItem>
			</MList>
		</MForm> -->
		<br>
		<br>
		<br>
		<br>
		<!-- 鬼畜嵌套 -->
		<!-- <MForm>
			<MFormItem>
				<MListItem :arrow="true" :indent="0" label="姓名">
					<template #label="">
						<div>鬼畜嵌套</div>
					</template>
				</MListItem>
			</MFormItem>
			<MFormItem>
				<MListItem :arrow="true" :indent="0" label="姓名">
					<template #label="">
						<div>鬼畜嵌套</div>
					</template>
				</MListItem>
			</MFormItem>
		</MForm> -->
		<br>
		<br>
		<br>
		<br>
		<!-- <MForm border>
			<MFormItem>
				<div>鬼畜嵌套</div>
			</MFormItem>
			<MFormItem>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
				<div>鬼畜嵌套</div>
			</MFormItem>
		</MForm> -->
	</div>
</template>
<script setup>
import { MList, MListItem } from '../index.m';

const handleCLick = () => {
	console.log(456);
};
</script>
