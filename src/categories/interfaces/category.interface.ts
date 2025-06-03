export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  projectId: string;
  projectName?: string;
  createdAt: Date;
  updatedAt: Date;
}
