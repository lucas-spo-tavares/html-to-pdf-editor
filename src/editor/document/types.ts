export type Unit = 'px' | 'mm' | 'in';

export type EditorMode = 'edit' | 'preview' | 'code';

export type PageSize = {
  name: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  width: number;
  height: number;
};

export type PageMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Frame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ObjectStyle = {
  background?: string;
  color?: string;
  border?: string;
  borderRadius?: number;
  opacity?: number;
  padding?: number;
  display?: 'block' | 'flex';
  flexDirection?: 'row' | 'column';
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain';
  backgroundPosition?: string;
};

export type TemplateBehavior = {
  if?: string;
  forEach?: {
    item: string;
    collection: string;
  };
};

export type EditorObject = {
  id: string;
  name: string;
  type: 'container' | 'text' | 'image' | 'group';
  frame: Frame;
  style: ObjectStyle;
  content?: string;
  template?: TemplateBehavior;
  children?: EditorObject[];
};

export type Asset = {
  id: string;
  name: string;
  path: string;
  contentType: string;
  dataUrl: string;
};

export type EditorDocument = {
  title: string;
  unit: Unit;
  page: {
    size: PageSize;
    orientation: 'portrait' | 'landscape';
    margin: PageMargin;
    background: string;
  };
  assets: Asset[];
  objects: EditorObject[];
  contextText: string;
};
