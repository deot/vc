import { ref } from 'vue';
import { Color } from '../color';
import type { ColorFormat } from '../color';

interface ColorInputProps {
	alpha: boolean;
	format?: ColorFormat;
}

interface ColorInputOptions {
	// 当前色值（输入框没有在键入时显示它）
	getValue: () => string;
	// 解析出与当前不同的色值时调用
	commit: (value: string) => void;
}

/**
 * 色值输入框：键入时只记文字，失焦或回车时按当前输出格式解析；与当前值相同或无法解析时恢复显示当前值
 * @param props ~
 * @param options ~
 * @returns ~
 */
export const useColorInput = (props: ColorInputProps, options: ColorInputOptions) => {
	// 正在键入的文本；null 时显示当前色值
	const text = ref<string | null>(null);

	const getText = () => text.value ?? options.getValue();

	const reset = () => {
		text.value = null;
	};

	const handleInput = (value: string) => {
		text.value = value;
	};

	const handleCommit = () => {
		const value = text.value;
		text.value = null;
		if (value === null) return;

		const color = Color.parse(value, { alpha: props.alpha, format: props.format });
		color && color.states.output !== options.getValue() && options.commit(color.states.output);
	};

	return {
		getText,
		reset,
		handleInput,
		handleCommit
	};
};
