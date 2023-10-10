import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'span'
	},
	color: {
		type: String,
	},
	borderColor: {
		type: String,
	},
	backgroundColor: {
		type: String,
	},
	backgroundSize: {
		type: String,
		default: 'cover'
	},
	backgroundImage: {
		type: String,
	},
	src: {
		type: String
	},

	variables: {
		type: Object,
		default: () => {
			return {};
		}
	},

	/**
	 * 伪类、伪元素
	 * {
	 * 	':hover div': {
	 * 		color: 'main'
	 * 	}
	 * }
	 */
	pseudo: {
		type: [String, Object]
	}
};
export type Props = ExtractPropTypes<typeof props>;