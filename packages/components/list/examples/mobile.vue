<template>
	<div>
		<MList :label-width="100" style="margin: 20px 0;">
			<MListItem :arrow="false" label="名称">
				<template #label="">
					<div />
				</template>
				<template #extra="">
					<div>2</div>
				</template>
			</MListItem>
			<MListItem label="名称" extra="示例描述" @click="handleClick"/>
			<MListItem :arrow="false" label="名称" extra="示例描述" />
		</MList>
		<MListItem :arrow="true" label="名称">
			<template #extra="">
				<div>alone</div>
			</template>
		</MListItem>
		<br>
		<br>
		<br>
		<br>
		<!-- 嵌套内容 -->
		<!-- <MForm>
			<MList :border="false">
				<MFormItem :indent="0">
					<MListItem :arrow="true" label="名称">
						<template #label="">
							<div>嵌套内容</div>
						</template>
					</MListItem>
				</MFormItem>
				<MFormItem :indent="0">
					<MListItem :arrow="true" label="名称">
						<template #label="">
							<div>嵌套内容</div>
						</template>
					</MListItem>
				</MFormItem>
			</MList>
		</MForm> -->
		<br>
		<br>
		<br>
		<br>
		<!-- 嵌套内容 -->
		<!-- <MForm>
			<MFormItem>
				<MListItem :arrow="true" :indent="0" label="名称">
					<template #label="">
						<div>嵌套内容</div>
					</template>
				</MListItem>
			</MFormItem>
			<MFormItem>
				<MListItem :arrow="true" :indent="0" label="名称">
					<template #label="">
						<div>嵌套内容</div>
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
				<div>嵌套内容</div>
			</MFormItem>
			<MFormItem>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
				<div>嵌套内容</div>
			</MFormItem>
		</MForm> -->
	</div>
</template>
<script setup>
import { MList, MListItem } from '../index.m';

const handleClick = () => {
	console.log(456);
};
</script>
