export interface Order {
  value: string;
  description: string;
  company: {
    name: string;
    return_url: string;
    cancel_url: string;
  };
}

export interface Links {
  rel: string;
  href: string;
  method: string;
}
