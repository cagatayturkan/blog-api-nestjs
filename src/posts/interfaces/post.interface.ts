export interface ContentBlock {
  order: number;
  title?: string; // Optional title
  content: string; // HTML content
}

export interface SeoData {
  title: string;
  description: string;
}

export interface Post {
  id: string; // Corresponds to _id
  userId: string | null; // string | null olarak güncellendi
  projectIdentifier: string; // Eklendi
  title: string;
  slug: string;
  contentBlocks: ContentBlock[];
  categories: string[];
  authors: string[];
  seo?: SeoData; // Optional SEO data
  featuredImage?: string; // Optional featured image URL
  language: string;
  isPublished: boolean; // Publication status
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