/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as spinProps } from './spin-props';

const COMPONENT_NAME = 'vc-spin';

export const Spin = defineComponent({
	name: COMPONENT_NAME,
	props: spinProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-spin">
					<span style={{ fontSize: `${props.size}px` }}>
						{ 
							slots?.loading?.() || (
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									version="1.1" 
									viewBox="0 0 32 32" 
									width="100%" 
									height="100%"
								>
									<path 
										stroke={props.foreground}
										d="M 16 2 A 14 14 0 1 0 30 15" 
										fill="none" 
										stroke-width="2" 
										stroke-linecap="round"
									/>
									<path 
										stroke={props.background}
										d="M 16 2 A 14 14 0 0 1 30 15" 
										fill="none" 
										stroke-width="2" 
										stroke-linecap="round"
									/>
								</svg>
							) 
						}
					</span>
					{ slots?.default?.() }
				</div>
			);
		};
	}
});