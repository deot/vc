import { toRect } from '../../vc/virtual-element';
import type { RectLike } from '../../vc';

export { toRect };

export type RevealMotion = {
	finished: Promise<void>;
	reverse: () => void;
	cancel: () => void;
};

export type RevealOptions = {
	// 不缩放的窗口，clip-path 写在它上面
	frame: Element;
	// 缩放的画面，transform 写在它上面
	body: Element;
	trigger: RectLike;
	// 画面静止时露出的盒子，相对 body 的左上角；缺省为整个 body
	subject?: RectLike | null;
	isLeave?: boolean;
	// 画面在播放的这一段里从透明淡入，isLeave 时淡出到透明；默认不透明
	opacity?: boolean;
	// 画面晚多少毫秒开始淡入（isLeave 时提前多少毫秒淡出完），窗口照常展开、缩回；大于 0 时同样淡入淡出
	delay?: number;
	// 打开时间轴上靠近触发元素的一段裁掉多少毫秒：打开从这一刻的姿态开始，isLeave 时停在同一个姿态结束。
	// 'auto' 按布局算：从窗口刚离开触发元素（留 8px）的姿态开始，最多从路程 40% 处开始；
	// 触发元素离画面很近或被画面盖住时也从 40% 处长出来，不退化成原位淡入淡出
	offset?: number | 'auto';
	// 与画面同一条时间轴淡入淡出的元素，如蒙层
	companion?: Element | null;
};

// 与 PhotoSwipe 一致的开合时长与缓动；控制点 (x1, y1, x2, y2) 还用来换算 offset
const CURVE = [0.4, 0, 0.22, 1];
export const REVEAL_DURATION = 333;
export const REVEAL_EASING = `cubic-bezier(${CURVE.join(', ')})`;

// 透明度匀速变化：缓动起步慢，透明度跟着它走时前几十毫秒几乎看不见
const opacityOf = (isLeave?: boolean): Keyframe[] => [{ opacity: isLeave ? 1 : 0 }, { opacity: isLeave ? 0 : 1 }];
const LINEAR = 'linear';
// offset 为 'auto' 时，窗口离开触发元素至少留的间距，以及起点最多到路程的多少
const GAP = 8;
const MAX_PROGRESS = 0.4;
// 裁掉一段后至少播放的毫秒数：剩下的姿态不变，按比例放慢，不会一闪而过
const MIN_PLAYED = 240;

const insetOf = (rect: RectLike, box: RectLike) => {
	const right = box.left + box.width - rect.left - rect.width;
	const bottom = box.top + box.height - rect.top - rect.height;
	return `inset(${rect.top - box.top}px ${right}px ${bottom}px ${rect.left - box.left}px)`;
};

// 夹到时间轴内，至少留 1ms
const clamp = (ms?: number) => Math.min(Math.max(ms || 0, 0), REVEAL_DURATION - 1);

const [X1, Y1, X2, Y2] = CURVE;
const bezier = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
// 二分求单调曲线上取到 value 的参数
const solve = (curve: (t: number) => number, value: number) => {
	let [low, high] = [0, 1];
	for (let i = 0; i < 30; i++) {
		const mid = (low + high) / 2;
		curve(mid) < value ? (low = mid) : (high = mid);
	}
	return (low + high) / 2;
};

// 时间（ms）→ 缓动后的路程进度，和反过来
const progressAt = (ms: number) => bezier(Y1, Y2, solve(t => bezier(X1, X2, t), ms / REVEAL_DURATION));
const timeAt = (progress: number) => REVEAL_DURATION * bezier(X1, X2, solve(t => bezier(Y1, Y2, t), progress));

/**
 * 打开从路程 progress 的姿态开始时，打开或关闭要裁掉多少毫秒。
 * 关闭从原位走回触发元素，同一个姿态在它的路程 1 - progress 处；缓动起步慢、收尾更慢，
 * 同样的路程在两端对应的时间不同（80ms 在打开开头是 21%，在关闭结尾只有 4%），所以按路程换算
 * @param progress 打开第一帧的路程进度
 * @param isLeave 是否关闭
 * @returns 裁掉的毫秒数
 */
const cutAt = (progress: number, isLeave?: boolean) => clamp(isLeave ? REVEAL_DURATION - timeAt(1 - progress) : timeAt(progress));

// offset 为毫秒数时，打开、关闭各裁掉多少毫秒
const cutOf = (offset?: number, isLeave?: boolean) => {
	const ms = clamp(offset);
	return isLeave && ms ? cutAt(progressAt(ms), true) : ms;
};

/**
 * 窗口按路程从 trigger 的盒子线性走到 subject 的盒子：离开 trigger（留 GAP）所需的最小路程
 * @param trigger 触发元素的盒子
 * @param subject 画面静止时的盒子
 * @returns 路程进度；走到终点仍压着 trigger 时为 null
 */
const clearOf = (trigger: RectLike, subject: RectLike) => {
	const [l, t, r, b] = [trigger.left, trigger.top, trigger.left + trigger.width, trigger.top + trigger.height];
	const [L, T, R, B] = [subject.left, subject.top, subject.left + subject.width, subject.top + subject.height];
	const progress = Math.min(
		R < r ? (r - l + GAP) / (r - R) : Infinity, // 右边越过 trigger 的左边
		L > l ? (r - l + GAP) / (L - l) : Infinity, // 左边越过 trigger 的右边
		B < b ? (b - t + GAP) / (b - B) : Infinity,
		T > t ? (b - t + GAP) / (T - t) : Infinity
	);
	return progress <= 1 ? progress : null;
};

// 与画面同一段时间淡入淡出：从实际播放的第一帧开始，到结束那一刻完成
const fadeAlong = (el: Element, isLeave: boolean | undefined, start: number): [Element, Keyframe[], KeyframeAnimationOptions] => [
	el,
	opacityOf(isLeave),
	{ duration: REVEAL_DURATION - start, easing: LINEAR, [isLeave ? 'endDelay' : 'delay']: start }
];

/**
 * fill 为 both：停在终点，由调用方 cancel 后回到元素自身的样式。每段的 delay + duration + endDelay 都等于 REVEAL_DURATION，同一刻结束。
 * offset 用负的 delay（打开，从中途开始）或负的 endDelay（关闭，停在打开第一帧的姿态）裁掉靠近触发元素的一段，各段仍同一刻结束
 * @param effects 每段的元素、关键帧和自己的计时
 * @param isLeave 是否关闭
 * @param cut 这一次裁掉的毫秒数，见 cutOf
 * @returns 进行中的动画
 */
const play = (effects: [Element, Keyframe[], KeyframeAnimationOptions?][], isLeave: boolean | undefined, cut: number): RevealMotion => {
	// 剩下的不足 MIN_PLAYED 时，各段计时同乘一个系数：缓动按迭代进度算，姿态不变，仍同一刻结束
	const scale = Math.max(MIN_PLAYED / (REVEAL_DURATION - cut), 1);
	const animations = effects.map(([el, keyframes, timing = {}]) => el.animate(keyframes, {
		easing: REVEAL_EASING,
		fill: 'both',
		...timing,
		duration: Number(timing.duration ?? REVEAL_DURATION) * scale,
		delay: ((timing.delay || 0) - (isLeave ? 0 : cut)) * scale,
		endDelay: ((timing.endDelay || 0) - (isLeave ? cut : 0)) * scale
	}));
	return {
		// 取消时同样结束等待
		finished: Promise.all(animations.map(item => item.finished)).then(() => {}, () => {}),
		reverse: () => animations.forEach(item => item.reverse()),
		cancel: () => animations.forEach(item => item.cancel())
	};
};

/**
 * 与 PhotoSwipe 一致：打开时画面按封面铺进 trigger，再放大回静止的位置；isLeave 时缩回 trigger。
 * 窗口（clip-path）留在不缩放的 frame 上，画面（transform）在 body 上，两者同一条缓动，四边才对齐。
 * 盒子都在调用时量，拖动、滚动后也从当前的位置开始
 * @param options 窗口、画面、触发元素、静止时的画面盒子、画面是否淡入淡出、淡入的延迟和裁掉的一段
 * @returns 进行中的动画；画面没有尺寸时为 null
 */
export const reveal = (options: RevealOptions): RevealMotion | null => {
	const { frame, body, trigger, isLeave } = options;
	const delay = clamp(options.delay);
	const box = frame.getBoundingClientRect();
	const origin = body.getBoundingClientRect();
	const local = options.subject || { left: 0, top: 0, width: origin.width, height: origin.height };
	if (!local.width || !local.height) return null;
	const scale = Math.max(trigger.width / local.width, trigger.height / local.height);
	const x = trigger.left + trigger.width / 2 - origin.left - (local.left + local.width / 2) * scale;
	const y = trigger.top + trigger.height / 2 - origin.top - (local.top + local.height / 2) * scale;
	const subject = { ...local, left: origin.left + local.left, top: origin.top + local.top };
	const cut = options.offset === 'auto'
		? cutAt(Math.min(clearOf(trigger, subject) ?? MAX_PROGRESS, MAX_PROGRESS), isLeave)
		: cutOf(options.offset, isLeave);
	const zoomed = { clipPath: insetOf(trigger, box), transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})` };
	const rest = { clipPath: insetOf(subject, box), transform: 'translate3d(0px, 0px, 0) scale(1)' };
	const [from, to] = isLeave ? [rest, zoomed] : [zoomed, rest];
	const effects: [Element, Keyframe[], KeyframeAnimationOptions?][] = [
		[frame, [{ clipPath: from.clipPath }, { clipPath: to.clipPath }]],
		[body, [{ transform: from.transform, transformOrigin: '0 0' }, { transform: to.transform, transformOrigin: '0 0' }]]
	];
	// 画面淡入淡出：从实际播放的第一帧（或 delay 之后）开始，到结束那一刻完成，不会以半透明出现或消失
	(options.opacity || delay) && effects.push(fadeAlong(body, isLeave, Math.max(delay, cut)));
	options.companion && effects.push(fadeAlong(options.companion, isLeave, cut));
	return play(effects, isLeave, cut);
};

/**
 * 没有触发元素时淡入淡出，时长和 offset 同 reveal，透明度匀速；offset 为 'auto' 时不裁
 * @param el 淡入淡出的元素
 * @param isLeave 是否关闭
 * @param offset 同 reveal
 * @param companion 同一段时间淡入淡出的元素
 * @returns 进行中的动画
 */
export const fade = (el: Element, isLeave?: boolean, offset?: number | 'auto', companion?: Element | null) => {
	const cut = cutOf(offset === 'auto' ? 0 : offset, isLeave);
	return play([el, companion].filter(Boolean).map(item => fadeAlong(item!, isLeave, cut)), isLeave, cut);
};
