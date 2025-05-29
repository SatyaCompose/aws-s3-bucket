import { getCTCategoriesForSitemapQuery, getProductCountByCategoryQuery } from "./graphQlQuery.js";
import { getClient } from "./ctClient.js";
import pLimit from "p-limit";
import { CategoryData, CategorySitemapData } from "types/category.js";

/**
 * Extracts category data from CommerceTools GraphQL response
 * Filters categories based on specific conditions:
 * - Has seoUrl custom field
 * - Is set to display
 * 
 * @param categories - Array of GraphQL responses containing category data
 * @returns Array of objects with name, id, lastModifiedAt, and slug properties
 */
export const getCTCategories = (categories: any) => {
    const categoryList: any = [];
    categories?.forEach((graphQlProducts: any) => {
        if (graphQlProducts?.body?.data?.categories?.results) {
            graphQlProducts?.body?.data?.categories?.results?.forEach((category: any) => {
                const slug = category?.custom?.customFieldsRaw?.find((field: any) => field?.name === 'seoUrl')?.value || '';
                const isDisplay = category?.custom?.customFieldsRaw?.find((field: any) => field?.name === 'Display')?.value || false;
                const categoryKey = category?.key as string;

                if (
                    slug !== '' &&
                    slug !== '/brands' &&
                    slug !== '/gift-cards' &&
                    isDisplay &&
                    !categoryKey?.includes('CKWSS')
                ) {
                    categoryList.push({
                        name: category?.name,
                        id: category?.id,
                        key: categoryKey,
                        lastModifiedAt: category?.lastModifiedAt,
                        slug: slug,
                    });
                }
            });
        }
    });

    return categoryList;
};

/**
 * Fetches categories from CommerceTools API for sitemap generation
 * Uses pagination to fetch all categories in batches of 500
 * 
 * @returns Array of GraphQL responses containing category data
 */
export const getCTCategoriesForSitemap = async () => {
    const adminClient = await getClient();
    const totalCategories = (await adminClient.categories().get().execute()).body.total;
    let offset = 0;
    const promise = [];
    while (offset < Number(totalCategories)) {
        promise.push(
            adminClient
                .graphql()
                .post({
                    body: {
                        query: getCTCategoriesForSitemapQuery(),
                        variables: {
                            limit: 500,
                            offset: offset,
                        },
                    },
                })
                .execute(),
        );
        offset += 500;
    }
    const categories = await Promise.all(promise);
    promise.push(categories
        .map((category: any) => category.body.data.categories.results)
    );
    const data = await Promise.all(promise);
    return data?.flat();
};

/**
 * Builds sitemap data from category list
 * Fetches product count for each category and calculates pagination
 * 
 * @param categories - Array of category data objects
 * @param productsPerPage - Number of products per page, defaults to 24
 * @returns Array of objects with category data, product count, and page count
 */

export const buildSitemapResponseForCTCategories = async (categories: CategoryData[]) => {
    const adminClient = await getClient();

    const limit = pLimit(10); // max 10 concurrent requests

    const promises = categories.map((category: CategoryData) =>
        limit(() =>
            adminClient.graphql().post({
                body: {
                    query: getProductCountByCategoryQuery(),
                    variables: {
                        limit: 1,
                        offset: 0,
                        whereCond: `masterData(current(categories(id=\"${category?.id}\"))) and
                                    masterData(current(masterVariant(attributes(name="isInactive" and value=false)))) and 
                                    masterData(current(masterVariant(attributes(name="isDisplay" and value=true))))`
                    }
                }
            }).execute().catch((err: any) => {
                console.warn(`Error fetching category ${category.id}`, err.message);
                return null;
            })
        )
    );

    const productCountResponses = await Promise.all(promises);

    const categoriesWithProductCount: CategorySitemapData[] = categories.map((category, index) => {
        const response = productCountResponses[index];
        const productCount = response?.body?.data?.products?.total || 0;
        const pageCount = Math.ceil(productCount / 32) || 1;

        return {
            ...category,
            productCount,
            pageCount
        };
    });

    return categoriesWithProductCount;
};
