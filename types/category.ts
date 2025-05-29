export interface CategoryData {
    name: string;
    id: string;
    lastModifiedAt: string;
    slug: string;
}

export interface CategorySitemapData extends CategoryData {
    productCount: number;
    pageCount: number;
}