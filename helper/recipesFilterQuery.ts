import { RecipeListBody } from "types/recipes.js";

const createFilterQuery = (key: string, values: string, separator: string): string => {
    if (!values) return '';
    const terms = values
        .split(separator)
        .map((term: string) => `"${term.trim()}"`)
        .join(', ');
    return `${key}=[${terms}]`;
}; 
const createLimitQuery = (limit: number, filterQuery: string, offset: number): string => {
    let recipeListQuery = '';

    recipeListQuery += `limit=${limit}`;
    recipeListQuery += `&offset=${offset}`;

    // Filter Query
    if (filterQuery) {
        recipeListQuery += `${filterQuery}`;
    }
    return recipeListQuery;
}

export const getAllRecipesQueryString = async (body: RecipeListBody, pageSize: number): Promise<string[]> => {
    try {
        let filterQuery = '';
        const page = body?.page || 1;

        // Prepare filter query
        const filter = body?.filter;

        if (filter && typeof filter === 'object') {
            const filterCategory = createFilterQuery('&query.data.categories.$in', filter?.category || '', '|');
            const filterTags = createFilterQuery('&query.data.tags.$in', filter?.tags || '', '|');
            const filterProduct = createFilterQuery('&query.data.products.$in', filter?.products || '', '|');

            // Build filter query string
            filterQuery = `${filterCategory}${filterTags}${filterProduct}`.replace(/&$/, ''); // Remove trailing '&'
        }

        // Prepare sort query
        let sortField = body?.sort?.field || 'Title';
        const sortOrder = body?.sort?.by === 'asc' ? 1 : -1;

        if (sortField === 'Title') {
            sortField = 'recipeTitle';
        }

        filterQuery += sortField === 'Date' ? `&sort.data.recordCreatedDate=${sortOrder}` : `&sort.data.${sortField}=${sortOrder}`;

        if (Number(body?.filterCreatedDays) > 0) {
            const currentDate = new Date();
            const fromTimestamp = currentDate.getTime() - (Number(body?.filterCreatedDays) * 24 * 60 * 60 * 1000);
            const toTimestamp = currentDate.getTime();

            filterQuery += `&query.data.recordCreatedDate={"$gte":${fromTimestamp},"$lte":${toTimestamp}}`;
        }

        return await getAllRecipesBuilderQuery(page, pageSize, filterQuery) as string[];
    } catch (error) {
        return [];
    }
};

const getAllRecipesBuilderQuery = async (page: number, pageSize: number, filterQuery: string): Promise<string[]> => {
    try {
        const recipeListQueryArray: string[] = [];
        // For each page, we want to get exactly pageSize items
        const limit = pageSize;
        const offset = (page - 1) * pageSize;
        const query = createLimitQuery(limit, filterQuery, offset);
        recipeListQueryArray.push(query);
        return recipeListQueryArray;
    } catch (err) {
        return [];
    }
};