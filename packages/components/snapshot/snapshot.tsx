/** @jsxImportSource vue */

import { nextTick, defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
import { props as snapshotProps } from './snapshot-props';
import { VcInstance, VcError } from '../vc/index';
import { Message } from '../message/index';

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
			snapdom.value = await snapDOM(
				current.value,
				{
					fast: false, // dom太大时会卡死一会儿
					...props.options
				}
			);

			return snapdom.value;
		};

		const toDataURL = async () => {
			await refresh();
			return snapdom.value.toRaw();
		};

		const downloadByDefault = async (options: any) => {
			await refresh();
			return snapdom.value.download(options);
		};

		const download = async (options: any) => {
			const loadContext = Message.loading('正在生成...');
			const downloadByUser = props.download || VcInstance.options.Snapshot?.download || (() => false);
			const skip = downloadByUser(instance, options);

			const done = async (v: boolean) => {
				try {
					v || await downloadByDefault(options);
				} finally {
					loadContext.destroy();
				}
			};

			if (skip && skip.then) {
				let skip$ = false;
				skip
					.then((v: any) => {
						skip$ = typeof v === 'undefined' ? true : !!v;
						return v;
					})
					.finally(() => done(skip$));
				return;
			}

			done(skip);
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

				!props.lazy && (await refresh());

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
