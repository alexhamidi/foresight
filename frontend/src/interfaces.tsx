export interface Item {
    link: string;
    title: string;
    description: string;
    source: string;
    source_link: string;
    image_url: string;
    created_at?: string;
    author_name: string;
    author_profile_url: string;
    similarity?: number;
}



export interface SearchFilters {
    daysAgo: number;
    resultsPerSource: number;
    arxivCategories: string[] | null;
    redditCategories: string[] | null;
    productHuntCategories: string[] | null;
}



export  interface StreamMessage {
    type: string;
    message: string;
    items?: Item[];
}
