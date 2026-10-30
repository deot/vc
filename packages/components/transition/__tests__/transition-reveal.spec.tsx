// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { config, mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

// 走真实 Transition，进入和离开钩子才会播放动画
config.global.stubs.transition = false;
import { TransitionReveal, VirtualElement } from '@deot/vc-components';
import { clickOn, rectOf } from '../../vc/__tests__/fixtures/click';
import { fade, reveal, toRect } from '../transition-reveal/reveal';

// 一段动画实际播放多久，以及裁掉的部分占整条时间轴的比例（拉长时两者都按同一系数变化，比例不变）
const playedOf = (timing: EffectTiming) => (timing.delay || 0) + Number(timing.duration) + (timing.endDelay || 0);
const cutRatioOf = (timing: EffectTiming) => -((timing.delay || 0) + (timing.endDelay || 0)) / Number(timing.duration);

const framesOf = (el: Element, key: string) => {
	return el.getAnimations().map(item => (item.effect as KeyframeEffect).getKeyframes().map(frame => frame[key]));
};

describe('reveal.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('measures a connected element and ignores the rest', () => {
		expect(toRect(null)).toBeNull();
		const el = document.createElement('div');
		expect(toRect(el)).toBeNull();

		document.body.append(el);
		el.getBoundingClientRect = () => rectOf(0, 0, 0, 10);
		expect(toRect(el)).toBeNull();
		el.getBoundingClientRect = () => rectOf(1, 2, 3, 4);
		expect(toRect(el)).toEqual({ left: 1, top: 2, width: 3, height: 4 });
	});

	it('expands from the trigger into the subject and shrinks back', async () => {
		const frame = document.createElement('div');
		const body = document.createElement('div');
		frame.append(body);
		document.body.append(frame);
		frame.getBoundingClientRect = () => rectOf(0, 0, 200, 100);
		body.getBoundingClientRect = () => rectOf(50, 20, 100, 40);
		const trigger = { left: 0, top: 0, width: 20, height: 10 };

		const opening = reveal({
			frame,
			body,
			trigger,
			subject: { left: 10, top: 5, width: 40, height: 20 }
		})!;
		expect(framesOf(frame, 'clipPath')).toEqual([['inset(0px 180px 90px 0px)', 'inset(25px 100px 55px 60px)']]);
		expect(framesOf(body, 'transform')).toEqual([[
			'translate3d(-55px, -22.5px, 0) scale(0.5)',
			'translate3d(0px, 0px, 0) scale(1)'
		]]);
		expect(body.getAnimations()[0].effect!.getTiming()).toMatchObject({
			duration: 333,
			easing: 'cubic-bezier(0.4, 0, 0.22, 1)'
		});
		opening.reverse();
		expect(body.getAnimations()[0].playbackRate).toBe(-1);
		opening.cancel();
		await opening.finished;

		expect(reveal({
			frame,
			body,
			trigger,
			subject: { left: 0, top: 0, width: 0, height: 10 }
		})).toBeNull();

		const leaving = reveal({ frame, body, trigger, isLeave: true })!;
		expect(framesOf(frame, 'clipPath')[0]).toEqual(['inset(20px 50px 40px 50px)', 'inset(0px 180px 90px 0px)']);
		expect(framesOf(body, 'transform')[0][1]).toBe('translate3d(-52.5px, -20px, 0) scale(0.25)');
		body.getAnimations()[0].finish();
		frame.getAnimations()[0].finish();
		await leaving.finished;
		leaving.reverse();
	});

	it('delays the picture after the window and clamps the delay', async () => {
		const frame = document.createElement('div');
		const body = document.createElement('div');
		frame.append(body);
		document.body.append(frame);
		frame.getBoundingClientRect = () => rectOf(0, 0, 200, 100);
		body.getBoundingClientRect = () => rectOf(50, 20, 100, 40);
		const trigger = { left: 0, top: 0, width: 20, height: 10 };
		const opacityOf = () => body.getAnimations().filter(item => (item.effect as KeyframeEffect).getKeyframes()[0].opacity !== undefined);

		// 打开：窗口和画面照常，画面晚 80ms 淡入，三段同一刻结束
		const opening = reveal({ frame, body, trigger, delay: 80 })!;
		expect(framesOf(frame, 'clipPath')).toHaveLength(1);
		const [fadeIn] = opacityOf();
		expect((fadeIn.effect as KeyframeEffect).getKeyframes().map(item => item.opacity)).toEqual([0, 1]);
		expect(fadeIn.effect!.getTiming()).toMatchObject({ delay: 80, duration: 253, fill: 'both' });
		opening.cancel();
		await opening.finished;

		// 关闭：提前 80ms 淡出完
		const leaving = reveal({ frame, body, trigger, isLeave: true, delay: 80 })!;
		const [fadeOut] = opacityOf();
		expect((fadeOut.effect as KeyframeEffect).getKeyframes().map(item => item.opacity)).toEqual([1, 0]);
		expect(fadeOut.effect!.getTiming()).toMatchObject({ endDelay: 80, duration: 253 });
		leaving.cancel();
		await leaving.finished;

		// 超过时长时留 1ms；负数和 0 不淡入
		const longer = reveal({ frame, body, trigger, delay: 1000 })!;
		expect(opacityOf()[0].effect!.getTiming()).toMatchObject({ delay: 332, duration: 1 });
		longer.cancel();
		await longer.finished;
		const negative = reveal({ frame, body, trigger, delay: -10 })!;
		expect(opacityOf()).toHaveLength(0);
		negative.cancel();
		await negative.finished;
	});

	it('cuts the part near the trigger with offset, and keeps every part ending together', async () => {
		const frame = document.createElement('div');
		const body = document.createElement('div');
		frame.append(body);
		document.body.append(frame);
		frame.getBoundingClientRect = () => rectOf(0, 0, 200, 100);
		body.getBoundingClientRect = () => rectOf(50, 20, 100, 40);
		const trigger = { left: 0, top: 0, width: 20, height: 10 };
		const timings = () => [...frame.getAnimations(), ...body.getAnimations()].map(item => item.effect!.getTiming());

		// 打开：从第 80ms 的姿态开始
		const opening = reveal({ frame, body, trigger, offset: 80 })!;
		expect(timings()).toMatchObject([{ duration: 333, delay: -80 }, { duration: 333, delay: -80 }]);
		opening.cancel();
		await opening.finished;

		// 关闭：停在打开第一帧的姿态。缓动收尾慢，80ms 的路程（21%）在关闭结尾要裁掉约 158ms，
		// 剩下的约 175ms 不足 240ms，按比例放慢到 240ms，裁掉的比例不变
		const leaving = reveal({ frame, body, trigger, isLeave: true, offset: 80 })!;
		timings().forEach((item) => {
			expect(cutRatioOf(item)).toBeCloseTo(158.44 / 333, 4);
			expect(playedOf(item)).toBeCloseTo(240, 6);
		});
		leaving.cancel();
		await leaving.finished;

		// 与 delay 叠加：画面从实际播放的第一帧和 delay 中较晚的一刻淡入，仍同一刻结束（剩 213ms，放慢到 240ms）
		const both = reveal({ frame, body, trigger, offset: 120, delay: 80 })!;
		timings().slice(0, 2).forEach(item => expect(cutRatioOf(item)).toBeCloseTo(120 / 333, 6));
		expect(timings()[2]).toMatchObject({ delay: 0 });
		timings().forEach(item => expect(playedOf(item)).toBeCloseTo(240, 6));
		both.cancel();
		await both.finished;
		const bothLeave = reveal({ frame, body, trigger, isLeave: true, offset: 40, delay: 80 })!;
		// 关闭裁掉约 79.6ms，画面淡出仍同一刻结束
		expect(timings()[2].duration).toBe(253);
		expect(timings()[2].endDelay).toBeCloseTo(80 - 79.58, 1);
		bothLeave.cancel();
		await bothLeave.finished;

		// 夹到时间轴内；0 时不改计时
		const longer = reveal({ frame, body, trigger, offset: 1000 })!;
		expect(cutRatioOf(timings()[0])).toBeCloseTo(332 / 333, 6);
		expect(playedOf(timings()[0])).toBeCloseTo(240, 6);
		longer.cancel();
		await longer.finished;
		const none = reveal({ frame, body, trigger, offset: -10 })!;
		expect(timings()[0].delay).toBe(0);
		none.cancel();
		await none.finished;

		// 淡入淡出同样裁掉，透明度在剩下的一段里匀速走完，不以半透明消失；剩下的不足 240ms 时放慢
		const fading = fade(body, true, 80);
		expect(body.getAnimations()[0].effect!.getTiming()).toMatchObject({ endDelay: 0, easing: 'linear' });
		expect(body.getAnimations()[0].effect!.getTiming().duration).toBeCloseTo(240, 6);
		fading.cancel();
		await fading.finished;
	});

	it('fades the picture over the played part with opacity, and stays opaque by default', async () => {
		const frame = document.createElement('div');
		const body = document.createElement('div');
		frame.append(body);
		document.body.append(frame);
		frame.getBoundingClientRect = () => rectOf(0, 0, 200, 100);
		body.getBoundingClientRect = () => rectOf(50, 20, 100, 40);
		const trigger = { left: 0, top: 0, width: 20, height: 10 };
		const fades = () => body.getAnimations().filter(item => (item.effect as KeyframeEffect).getKeyframes()[0].opacity !== undefined);
		const run = async (options: Partial<Parameters<typeof reveal>[0]>) => {
			const motion = reveal({ frame, body, trigger, ...options })!;
			const result = fades().map(item => ({
				opacity: (item.effect as KeyframeEffect).getKeyframes().map(key => key.opacity),
				...item.effect!.getTiming()
			}));
			motion.cancel();
			await motion.finished;
			return result;
		};

		// 默认不透明（file-preview）
		expect(await run({})).toEqual([]);
		// 整段淡入、淡出
		expect(await run({ opacity: true })).toMatchObject([{ opacity: [0, 1], delay: 0, duration: 333 }]);
		// 与 offset 一起：从播放的第一帧开始淡入，关闭到结束那一刻淡完，不以半透明出现或消失（剩下的放慢到 240ms）
		const [enter] = await run({ opacity: true, offset: 110 });
		expect(enter).toMatchObject({ opacity: [0, 1], delay: 0 });
		expect(enter.duration).toBeCloseTo(240, 6);
		const [leave] = await run({ opacity: true, offset: 110, isLeave: true });
		expect(leave.opacity).toEqual([1, 0]);
		expect(leave.endDelay).toBeCloseTo(0, 6);
		expect(leave.duration).toBeCloseTo(240, 6);
	});

	it('starts where the window leaves the trigger with offset auto, and fades the companion along', async () => {
		const frame = document.createElement('div');
		const body = document.createElement('div');
		const mask = document.createElement('div');
		frame.append(body);
		document.body.append(frame, mask);
		frame.getBoundingClientRect = () => rectOf(0, 0, 200, 100);
		body.getBoundingClientRect = () => rectOf(50, 20, 100, 40);
		const trigger = { left: 0, top: 0, width: 20, height: 10 };
		const timingsOf = (el: Element) => el.getAnimations().map(item => item.effect!.getTiming());

		// 往右离开 20px 宽的 trigger 再留 8px 要走到路程 56%，往下要 90%：都超过上限，从路程 40%（第 106ms）开始。
		// 剩下的约 227ms 放慢到 240ms
		const opening = reveal({ frame, body, trigger, offset: 'auto', companion: mask })!;
		[...timingsOf(frame), ...timingsOf(body)].forEach((item) => {
			expect(cutRatioOf(item)).toBeCloseTo(106.01 / 333, 4);
			expect(playedOf(item)).toBeCloseTo(240, 6);
		});
		// 蒙层在剩下的一段里从透明匀速淡入，同一刻结束
		expect(framesOf(mask, 'opacity')).toEqual([[0, 1]]);
		expect(timingsOf(mask)[0]).toMatchObject({ delay: 0, easing: 'linear' });
		expect(timingsOf(mask)[0].duration).toBeCloseTo(240, 6);
		opening.cancel();
		await opening.finished;

		// 关闭停在同一个姿态（关闭时间轴上路程 60% 处，裁掉约 199ms），剩下的放慢到 240ms
		const leaving = reveal({ frame, body, trigger, offset: 'auto', isLeave: true, companion: mask })!;
		[...timingsOf(frame), ...timingsOf(body)].forEach((item) => {
			expect(cutRatioOf(item)).toBeCloseTo(199.21 / 333, 4);
			expect(playedOf(item)).toBeCloseTo(240, 6);
		});
		expect(framesOf(mask, 'opacity')).toEqual([[1, 0]]);
		expect(timingsOf(mask)[0].duration).toBeCloseTo(240, 6);
		leaving.cancel();
		await leaving.finished;

		// 画面终点压着 trigger：不退化成原位淡入淡出，同样从路程 40% 处长出来
		const covered = reveal({ frame, body, trigger: { left: 60, top: 30, width: 20, height: 10 }, offset: 'auto' })!;
		expect(framesOf(frame, 'clipPath')).toHaveLength(1);
		expect(cutRatioOf(timingsOf(body)[0])).toBeCloseTo(106.01 / 333, 4);
		covered.cancel();
		await covered.finished;

		// 没有触发元素时的淡入淡出：auto 不裁，蒙层同一段
		const fading = fade(body, false, 'auto', mask);
		expect(timingsOf(body)).toMatchObject([{ delay: 0, duration: 333 }]);
		expect(timingsOf(mask)).toMatchObject([{ delay: 0, duration: 333 }]);
		fading.cancel();
		await fading.finished;
	});

	it('fades in and out over the same duration', async () => {
		const el = document.createElement('div');
		document.body.append(el);
		const leaving = fade(el, true);
		expect(framesOf(el, 'opacity')).toEqual([[1, 0]]);
		el.getAnimations()[0].finish();
		await leaving.finished;

		const entering = fade(el);
		expect(framesOf(el, 'opacity')).toEqual([[0, 1]]);
		entering.cancel();
		await entering.finished;
	});
});

describe('TransitionReveal', () => {
	const layout = HTMLElement.prototype.getBoundingClientRect;
	const rects = new Map<string, DOMRect>();

	beforeEach(() => {
		HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
			for (const [name, rect] of rects) {
				if (this.classList.contains(name)) return rect;
			}
			return layout.call(this);
		};
	});

	afterEach(() => {
		HTMLElement.prototype.getBoundingClientRect = layout;
		rects.clear();
		document.body.innerHTML = '';
		// 清掉最近一次点击的位置，各用例互不影响
		clickOn(null);
	});

	const mountReveal = (trigger?: Element | VirtualElement | null, delay?: number | { enter?: number; leave?: number }) => {
		const shown = ref(false);
		const wrapper = mount({
			setup: () => ({ shown, trigger, delay }),
			components: { TransitionReveal },
			template: `
				<div class="frame">
					<TransitionReveal :trigger-element="trigger" :delay="delay">
						<div v-show="shown" class="panel">内容</div>
					</TransitionReveal>
				</div>
			`
		}, { attachTo: document.body });
		return { shown, wrapper };
	};

	it('expands from the clicked point when the button is gone before opening, and shrinks back there', async () => {
		const button = document.createElement('button');
		button.getBoundingClientRect = () => rectOf(10, 20, 40, 20);
		document.body.append(button);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(40, 30, 80, 40));
		const { shown, wrapper } = mountReveal();
		const frame = wrapper.find('.frame').element;

		// 如点下拉菜单项后先请求：请求回来时菜单已收起，菜单项被移出文档，退到点下的那个点（按钮中心 30,30）
		await clickOn(button);
		button.remove();
		await Utils.sleep(0);
		shown.value = true;
		await nextTick();
		expect(framesOf(frame, 'clipPath')).toEqual([['inset(30px 170px 70px 30px)', 'inset(30px 80px 30px 40px)']]);
		frame.getAnimations().forEach(item => item.finish());
		wrapper.find('.panel').element.getAnimations().forEach(item => item.finish());
		for (let i = 0; i < 6; i++) await nextTick();

		shown.value = false;
		await nextTick();
		expect(framesOf(frame, 'clipPath')[0][1]).toBe('inset(30px 170px 70px 30px)');
		wrapper.unmount();
	});

	it('expands from the clicked button and returns along the same animation', async () => {
		const button = document.createElement('button');
		const label = document.createElement('span');
		button.append(label);
		button.getBoundingClientRect = () => rectOf(10, 20, 40, 20);
		document.body.append(button);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(40, 30, 80, 40));

		const { shown, wrapper } = mountReveal();
		// 点在按钮里的文字上，从整个按钮展开
		await clickOn(label);
		shown.value = true;
		await nextTick();

		const frame = wrapper.find('.frame').element;
		const panel = wrapper.find('.panel').element;
		expect(framesOf(frame, 'clipPath')).toEqual([['inset(20px 150px 60px 10px)', 'inset(30px 80px 30px 40px)']]);
		expect(framesOf(panel, 'transform')[0][0]).toBe('translate3d(-30px, -10px, 0) scale(0.5)');

		const [move] = panel.getAnimations();
		shown.value = false;
		await nextTick();
		expect(panel.getAnimations()).toEqual([move]);
		expect(move.playbackRate).toBe(-1);
		frame.getAnimations()[0].finish();
		move.finish();
		for (let i = 0; i < 6; i++) await nextTick();
		expect((panel as HTMLElement).style.display).toBe('none');

		// 不是点击打开时淡入
		await clickOn(null);
		shown.value = true;
		await nextTick();
		expect(framesOf(panel, 'opacity')).toEqual([[0, 1]]);
		wrapper.unmount();
	});

	it('shrinks back to where the trigger was when it is gone before the close', async () => {
		const button = document.createElement('button');
		button.getBoundingClientRect = () => rectOf(10, 20, 40, 20);
		document.body.append(button);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(40, 30, 80, 40));
		const { shown, wrapper } = mountReveal();
		const frame = wrapper.find('.frame').element;
		const panel = wrapper.find('.panel').element;
		const toggle = async (value: boolean, target: Element | null) => {
			await clickOn(target);
			shown.value = value;
			await nextTick();
		};
		const finish = async () => {
			[frame, panel].forEach(el => el.getAnimations().forEach(item => item.finish()));
			for (let i = 0; i < 6; i++) await nextTick();
		};

		await toggle(true, button);
		const [opening] = framesOf(frame, 'clipPath');
		await finish();

		// 如随下拉菜单收起的菜单项：关闭前已移出文档，缩回打开时它所在的位置
		button.remove();
		await toggle(false, null);
		expect(framesOf(frame, 'clipPath')).toEqual([[opening[1], opening[0]]]);
		await finish();
		wrapper.unmount();
	});

	it('keeps the trigger when a close is reversed, and fades once the click is cleared', async () => {
		const button = document.createElement('button');
		button.getBoundingClientRect = () => rectOf(10, 20, 40, 20);
		document.body.append(button);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(40, 30, 80, 40));
		const { shown, wrapper } = mountReveal();
		const frame = wrapper.find('.frame').element;
		const panel = wrapper.find('.panel').element;
		const toggle = async (value: boolean, target: Element | null) => {
			await clickOn(target);
			shown.value = value;
			await nextTick();
		};
		const finish = async () => {
			[frame, panel].forEach(el => el.getAnimations().forEach(item => item.finish()));
			for (let i = 0; i < 6; i++) await nextTick();
		};

		await toggle(true, button);
		await finish();
		// 关闭途中又点开：沿原路退回，最终是打开，触发元素还在
		await toggle(false, button);
		await toggle(true, button);
		await finish();
		await toggle(false, null);
		expect(framesOf(frame, 'clipPath')).toHaveLength(1);
		await finish();

		// 点在页面空白处后再打开：淡入
		await toggle(true, null);
		expect(framesOf(panel, 'opacity')).toEqual([[0, 1]]);
		wrapper.unmount();
	});

	it('fades without a click, and when the content has no size', async () => {
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(40, 30, 80, 40));
		const { shown, wrapper } = mountReveal(null);
		shown.value = true;
		await nextTick();
		const panel = wrapper.find('.panel').element;
		expect(framesOf(wrapper.find('.frame').element, 'clipPath')).toEqual([]);
		expect(framesOf(panel, 'opacity')).toEqual([[0, 1]]);
		wrapper.unmount();

		// 点击打开，但内容没有尺寸：同样淡入
		rects.set('panel', rectOf(0, 0, 0, 0));
		const button = document.createElement('button');
		button.getBoundingClientRect = () => rectOf(10, 20, 40, 20);
		document.body.append(button);
		const clicked = mountReveal();
		await clickOn(button);
		clicked.shown.value = true;
		await nextTick();
		expect(framesOf(clicked.wrapper.find('.frame').element, 'clipPath')).toEqual([]);
		expect(framesOf(clicked.wrapper.find('.panel').element, 'opacity')).toEqual([[0, 1]]);
		clicked.wrapper.unmount();
	});

	it('uses triggerElement instead of the click', async () => {
		const trigger = document.createElement('a');
		trigger.getBoundingClientRect = () => rectOf(0, 0, 20, 10);
		document.body.append(trigger);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(50, 20, 100, 40));
		const { shown, wrapper } = mountReveal(trigger);
		const button = document.createElement('button');
		button.getBoundingClientRect = () => rectOf(100, 50, 40, 20);
		document.body.append(button);
		await clickOn(button);
		shown.value = true;
		await nextTick();
		expect(framesOf(wrapper.find('.frame').element, 'clipPath')[0][0]).toBe('inset(0px 180px 90px 0px)');
		wrapper.unmount();
	});

	it('expands from a zero-size VirtualElement such as a caret', async () => {
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(50, 20, 100, 40));
		const { shown, wrapper } = mountReveal(new VirtualElement({ left: 5, top: 5, width: 0, height: 0 }));
		shown.value = true;
		await nextTick();
		expect(framesOf(wrapper.find('.frame').element, 'clipPath')[0][0]).toBe('inset(5px 195px 95px 5px)');
		wrapper.unmount();
	});

	it('shrinks back to where triggerElement was when it is removed before closing', async () => {
		const trigger = document.createElement('a');
		trigger.getBoundingClientRect = () => rectOf(0, 0, 20, 10);
		document.body.append(trigger);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(50, 20, 100, 40));
		const { shown, wrapper } = mountReveal(trigger);
		const frame = wrapper.find('.frame').element;
		shown.value = true;
		await nextTick();
		[frame, wrapper.find('.panel').element].forEach(el => el.getAnimations().forEach(item => item.finish()));
		for (let i = 0; i < 6; i++) await nextTick();

		// 传入的元素关闭前已被移除：缩回打开时它所在的位置
		trigger.remove();
		shown.value = false;
		await nextTick();
		expect(framesOf(frame, 'clipPath')[0][1]).toBe('inset(0px 180px 90px 0px)');
		wrapper.unmount();
	});

	it('reads the enter and leave delay separately, and fades without a delay', async () => {
		const trigger = document.createElement('a');
		trigger.getBoundingClientRect = () => rectOf(0, 0, 20, 10);
		document.body.append(trigger);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(50, 20, 100, 40));
		const { shown, wrapper } = mountReveal(trigger, { enter: 120 });
		const panel = wrapper.find('.panel').element;
		const finish = async () => {
			[wrapper.find('.frame').element, panel].forEach(el => el.getAnimations().forEach(item => item.finish()));
			for (let i = 0; i < 6; i++) await nextTick();
		};

		shown.value = true;
		await nextTick();
		expect(framesOf(panel, 'opacity')).toEqual([[undefined, undefined], [0, 1]]);
		expect(panel.getAnimations()[1].effect!.getTiming()).toMatchObject({ delay: 120, duration: 213 });
		await finish();

		// leave 没给：关闭时画面不淡出
		shown.value = false;
		await nextTick();
		expect(framesOf(panel, 'opacity')).toEqual([[undefined, undefined]]);
		await finish();

		// 触发元素移出文档：只淡入淡出，不带 delay
		trigger.remove();
		shown.value = true;
		await nextTick();
		expect(framesOf(panel, 'opacity')).toEqual([[0, 1]]);
		expect(panel.getAnimations()[0].effect!.getTiming().delay).toBe(0);
		wrapper.unmount();
	});

	it('reads the enter and leave offset separately', async () => {
		const trigger = document.createElement('a');
		trigger.getBoundingClientRect = () => rectOf(0, 0, 20, 10);
		document.body.append(trigger);
		rects.set('frame', rectOf(0, 0, 200, 100));
		rects.set('panel', rectOf(50, 20, 100, 40));
		const shown = ref(false);
		const wrapper = mount({
			setup: () => ({ shown, trigger }),
			components: { TransitionReveal },
			template: `
				<div class="frame">
					<TransitionReveal :trigger-element="trigger" :offset="{ enter: 80 }">
						<div v-show="shown" class="panel">内容</div>
					</TransitionReveal>
				</div>
			`
		}, { attachTo: document.body });
		const panel = wrapper.find('.panel').element;
		const finish = async () => {
			[wrapper.find('.frame').element, panel].forEach(el => el.getAnimations().forEach(item => item.finish()));
			for (let i = 0; i < 6; i++) await nextTick();
		};

		shown.value = true;
		await nextTick();
		expect(panel.getAnimations()[0].effect!.getTiming()).toMatchObject({ delay: -80 });
		await finish();

		// leave 没给：完整缩回
		shown.value = false;
		await nextTick();
		expect(panel.getAnimations()[0].effect!.getTiming().endDelay).toBe(0);
		await finish();
		wrapper.unmount();
	});
});
