
import { ClientResponse, ErrorResponse, GraphQLResponse } from "@commercetools/platform-sdk";
import {
    buildSitemapResponseForCTCategories,
    getCTCategories,
    getCTCategoriesForSitemap,
} from "./buildCategoryUrlList.js";

/**
 * Fetches category data with product counts and pagination information
 * for sitemap generation
 * 
 * @returns Promise resolving to array of CategorySitemapData or error response
 */
export const ctCategorySitemapData = async () => {
    try {
        const categories = await getCTCategoriesForSitemap() as ClientResponse<GraphQLResponse>[];
        const ctCategories = await getCTCategories(categories);
        const sitemapCategories = await buildSitemapResponseForCTCategories(ctCategories);
        return sitemapCategories;
    } catch (err) {
        return {
            statusCode: (err as ErrorResponse)?.statusCode || 500,
            body: typeof err === 'string' ? err : JSON.stringify(err),
        };
    }
};