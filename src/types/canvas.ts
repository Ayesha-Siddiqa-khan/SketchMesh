export type ToolType = "select" | "pen" | "rectangle" | "ellipse" | "arrow" | "sticky" | "text" | "commentPin";

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  text?: string;
  points?: { x: number; y: number }[]; // For pen drawings
  endX?: number; // For arrows
  endY?: number;
}

export interface CanvasState {
  elements: CanvasElement[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface PostItem {
  id: string;
  title: string;
  content: string;
  sketchData: CanvasState;
  thumbnailUrl: string;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  forkedFrom?: {
    id: string;
    title: string;
    author: {
      username: string;
    };
  } | null;
  _count?: {
    remixes: number;
    comments: number;
  };
}

export interface PinnedComment {
  id: string;
  body: string;
  coordX: number | null;
  coordY: number | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}
