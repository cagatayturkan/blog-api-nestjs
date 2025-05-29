export interface ContentBlock {
  order: number;
  title?: string; // Optional title
  content: string; // HTML content
}

export interface SeoData {
  title: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export interface Post {
  id: string;
  projectId: string; // Changed from projectIdentifier to projectId
  slug: string;
  title: string;
  contentBlocks: ContentBlock[] | null;
  categories: Category[] | null;
  authors: string[] | null;
  seo: SeoData | null;
  featuredImage: string | null;
  language: string;
  isPublished: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the raw data format from mock.json (internal use)
export interface MockPost {
  _id: string;
  user_id: string;
  type: string; // e.g., "our-news"
  attributes: {
    boxContent: Array<{ order: number; title?: string; content: string }>;
    'our-news-category': string[];
    authors: string[];
    title: string;
    slug: string;
    seo: {
      metaTitle: string;
      metaDesc: string;
    };
    img?: string;
  };
  lang: string;
  createdAt: string; // String initially, will be converted to Date
  updatedAt: string; // String initially, will be converted to Date
  __v: number;
} 