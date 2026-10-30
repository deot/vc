import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { RectLike } from '../../../vc';
import type { Size } from '../utils';

// 画面静止时在这一页里的盒子；返回 null 时按整页
export type RevealSubject = (viewport: Size) => RectLike | null;

export type RevealContext = {
	// 画面就位后调用：图片解码完、视频拿到尺寸、音频和文件挂载后。打开时返回放大结束的 Promise
	ready: (subject?: RevealSubject) => Promise<void> | void;
	// 画面要等一阵才就位（图片不用缩略图垫底、视频等尺寸）：打开的那一项先淡入蒙层、显示加载中
	wait: () => void;
};

export const REVEAL_KEY: InjectionKey<RevealContext> = Symbol('vc-reveal');

export const useReveal = () => inject(REVEAL_KEY, null);
