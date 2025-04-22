<template>
	<div class="demo">
		<div style="display: flex; flex-direction: column; height: 100%">
			<div>header</div>
			<div style="flex: 1; overflow: hidden;">
				<Resizer style="padding: 40px; background: gray;" @resize="handleResize">
					<template #default="{ style, height, width }">
						<div style="border: 1px solid red; box-sizing: border-box;" :style="style">
							width: {{ width }}
							height: {{ height }}
							style: {{ style }}
						</div>
					</template>
				</Resizer>
			</div>
			<div>footer</div>
		</div>
	</div>
</template>
<script setup>
import { Resizer } from '..';

const handleResize = (e) => {
	console.log(e);
};
</script>
<style>
.demo {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: 100%;
	box-sizing: border-box;
}
</style>
