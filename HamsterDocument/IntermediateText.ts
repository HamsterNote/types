export enum TextDir {
	TTB = 'ttb',
	LTR = 'ltr',
	RTL = 'rtl',
}

export interface IntermediateTextSerialized {
	id: string;
	// 文字内容
	content: string;
	// 字体大小，大于等于 1 的按 px 计算，小于 1 的按 em  计算
	fontSize: number;
	// 字体，字体具体需要用户下载，这里只定义字体名称
	fontFamily: string;
	// 字重，默认 500
	fontWeight: number;
	// 是否斜体
	italic: boolean;
	// 字体颜色
	color: string;
	// 整体宽度
	width: number;
	// 整体高度
	height: number;
	// 行高
	lineHeight: number;
	// x 坐标, 大于等于 1 的按 px，小于 1 的按 百分比
	x: number;
	// y 坐标, 大于等于 1 的按 px，小于 1 的按 百分比
	y: number;
	// 字体 baseline
	ascent: number;
	// 字体 descent
	descent: number;
	// 垂直文字
	vertical?: boolean;
	// 文字方向
	dir: TextDir;
	// 旋转
	rotate: number;
	// 倾斜
	skew: number;
	// 是否是行末
	isEOL: boolean;
}

export class IntermediateText implements IntermediateTextSerialized {
	public id: string;
	public content: string;
	public fontSize: number;
	public fontFamily: string;
	public fontWeight: number;
	public italic: boolean;
	public color: string;
	public width: number;
	public height: number;
	public lineHeight: number;
	public x: number;
	public y: number;
	public ascent: number;
	public descent: number;
	public vertical?: boolean;
	public dir: TextDir;
	public rotate: number;
	public skew: number;
	public isEOL: boolean;
	static serialize(text: IntermediateText): IntermediateTextSerialized {
		return {
			...text,
		};
	}
	static parse(data: IntermediateTextSerialized): IntermediateText {
		return new IntermediateText(data);
	}
	constructor({
		id,
		content,
		fontSize,
		fontFamily,
		fontWeight,
		italic,
		color,
		width,
		height,
		lineHeight,
		x,
		y,
		ascent,
		descent,
		vertical,
		dir,
		rotate,
		skew,
		isEOL,
  }: IntermediateTextSerialized) {
		this.id = id;
		this.content = content;
		this.fontSize = fontSize;
		this.fontFamily = fontFamily;
		this.fontWeight = fontWeight;
		this.italic = italic;
		this.color = color;
		this.width = width;
		this.height = height;
		this.lineHeight = lineHeight;
		this.x = x;
		this.y = y;
		this.ascent = ascent;
		this.descent = descent;
		this.vertical = vertical;
		this.dir = dir;
		this.rotate = rotate;
		this.skew = skew;
		this.isEOL = isEOL;
	}
}

export enum TextMarkedContentType {
	BEGIN_MARKED_CONTENT = 'beginMarkedContent',
	BEGIN_MARKED_CONTENT_PROPS = 'beginMarkedContentProps',
	END_MARKED_CONTENT = 'endMarkedContent',
}

export class IntermediateTextMarkedContent extends IntermediateText {
	// 这两个值参见 pdfjs 的 TextMarkedContent 类型
	constructor(data: IntermediateTextSerialized, private type: TextMarkedContentType, private markedContentId: string) {
		super(data);
	}
}
