/** @jsxImportSource vue */

import { defineComponent } from 'vue';

const COMPONENT_NAME = 'vcm-dropdown-menu';

/**
 * 移动端菜单：与 DropdownMenu 相同的 ul，带标记类 vcm-dropdown-menu，铺满弹层宽度
 */
export const MDropdownMenu = defineComponent({
	name: COMPONENT_NAME,
	setup(_, { slots }) {
		return () => {
			return (
				<ul class="vc-dropdown-menu vcm-dropdown-menu">
					{ slots?.default?.() }
				</ul>
			);
		};
	}
});
