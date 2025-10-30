/** @jsxImportSource vue */

import { defineComponent, ref, onMounted } from 'vue';
import { props as snapshotProps } from './snapshot-props';
import { VcInstance, VcError } from '../vc/index';

const COMPONENT_NAME = 'vc-snapshot';

export const Snapshot = defineComponent({
	name: COMPONENT_NAME,
	props: snapshotProps,
	emits: ['ready'],
	setup(props, { emit, slots, expose }) {
		const current = ref<any>();
		const instance = ref();

		// 网络的图片如果没有加上crossOrigin，且没有放在第一个就会出现问题（Safari）
		const refresh = async () => {
			if (!props.crossOrigin) return;
			const transformSource = props.transformSource || VcInstance.options.Snapshot?.transformSource || ((v: any) => v);

			return Promise.all(Array.from(current.value.querySelectorAll('img')).map((node: any) => {
				return new Promise<any>((resolve) => {
					(async () => {
						let url;
						try {
							url = await transformSource(node.src);
						} catch (e) {
							console.error(e);
						}

						const image = new Image();
						image.crossOrigin = props.crossOrigin;
						image.src = `${url}?=${new Date().getTime()}`; // 强制不缓存
						image.onload = () => {
							node.src = image.src;
							resolve(1);
						};
						image.onerror = () => resolve(0);
					})();
				});
			}));
		};

		const toDataURL = async () => {
			await refresh();
			return instance.value.toRaw();
		};

		const download = async (options: any) => {
			await refresh();
			const _download = VcInstance.options.Snapshot?.download || (() => false);

			const allow = _download(options);

			if (allow && allow.then) {
				allow.catch(() => {
					instance.value.download(options);
				});
				return;
			}

			allow || instance.value.download(options);
		};

		expose({
			instance,
			refresh,
			toDataURL,
			download
		});

		onMounted(async () => {
			try {
				let snapDOM = (window as any).snapdom || await import('@zumer/snapdom');
				snapDOM = snapDOM.snapdom || snapDOM;

				instance.value = await snapDOM(current.value, props.options);

				emit('ready', {
					instance: instance.value,
					dependencies: {
						snapDOM
					}
				});
			} catch (e) {
				throw new VcError('snapshot', e);
			}
		});

		return () => {
			return (
				<div ref={current} class="vc-snapshot">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
