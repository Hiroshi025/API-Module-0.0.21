export interface Page {
  title: string;
  description: string;
  path: string;
  createdAt: string;
  url: string;
}

export interface Files {
  name: string;
  url: string;
  contentType: string;
  size: number;
}
