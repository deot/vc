/** @jsxImportSource vue */

import { nextTick, defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
import { props as snapshotProps } from './snapshot-props';
import { VcInstance, VcError } from '../vc/index';

const COMPONENT_NAME = 'vc-snapshot';

export const Snapshot = defineComponent({
	name: COMPONENT_NAME,
	props: snapshotProps,
	emits: ['ready'],
	setup(props, { emit, slots, expose }) {
		let snapDOM;
		const instance = getCurrentInstance()!;
		const current = ref<any>();
		const snapdom = ref();

		const refresh = async () => {
			await nextTick();
			snapdom.value = await snapDOM(current.value, props.options);

			return snapdom.value;
		};

		const toDataURL = async () => {
			await refresh();
			return snapdom.value.toRaw();
		};

		const download = async (options: any) => {
			await refresh();
			const _download = props.download || VcInstance.options.Snapshot?.download || (() => false);

			const skip = _download(instance, options);

			if (skip && skip.then) {
				let skip$ = false;
				skip
					.then((v: any) => {
						skip$ = typeof v === 'undefined' ? true : !!v;
						return v;
					})
					.finally(() => {
						skip$ || snapdom.value.download(options);
					});
				return;
			}

			skip || snapdom.value.download(options);
		};

		expose({
			snapdom,
			refresh,
			toDataURL,
			download
		});

		onMounted(async () => {
			try {
				snapDOM = (window as any).snapdom || await import('@zumer/snapdom');
				snapDOM = snapDOM.snapdom || snapDOM;

				await refresh();

				emit('ready', {
					instance,
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
