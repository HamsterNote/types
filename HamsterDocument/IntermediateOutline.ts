import { IntermediateText, IntermediateTextSerialized } from './IntermediateText';

export enum IntermediateOutlineDestType {
	TEXT = 'text',
	PAGE = 'page',
	POSITION = 'position',
	URL = 'url',
}

// export interface IntermediateOutlineDest {
// 	targetType: IntermediateOutlineDestType;
// }

export type IntermediateOutlineDest = IntermediateOutlineDestPage | IntermediateOutlineDestText | IntermediateOutlineDestPosition | IntermediateOutlineDestUrl;

export interface IntermediateOutlineDestUrl {
	targetType: IntermediateOutlineDestType.URL;
	url: string;
	unsafeUrl: string | undefined;
	newWindow: boolean;
}

export interface IntermediateOutlineDestPage {
	targetType: IntermediateOutlineDestType.PAGE;
	pageId: string;
	items?: IntermediateOutlineDest[];
}

export interface IntermediateOutlineDestText {
	targetType: IntermediateOutlineDestType.TEXT;
	textId: string;
	items?: IntermediateOutlineDest[];
}

export interface IntermediateOutlineDestPosition {
	targetType: IntermediateOutlineDestType.POSITION;
	items?: IntermediateOutlineDest[];
}

export interface IntermediateOutlineSerialized extends IntermediateTextSerialized {
    dest: IntermediateOutlineDest;
}

export class IntermediateOutline extends IntermediateText implements IntermediateOutlineSerialized {
    public dest: IntermediateOutlineDest;
    static serialize(outline: IntermediateOutline): IntermediateOutlineSerialized {
        return {
            ...IntermediateText.serialize(outline),
            dest: outline.dest,
        };
    }
    static parse(data: IntermediateOutlineSerialized): IntermediateOutline {
        return new IntermediateOutline(data);
    }
    constructor(data: IntermediateOutlineSerialized) {
        const { dest, ...textData } = data;
        super(textData as IntermediateTextSerialized);
        this.dest = dest;
    }
}
