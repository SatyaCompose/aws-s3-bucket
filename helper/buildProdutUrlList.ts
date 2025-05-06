import { ClientResponse, GraphQLResponse } from "@commercetools/platform-sdk";
import { getCTProductsForSitemapQuery } from "./graphQlQuery";
import { getClient } from "./ctClient";

/**
 * Builds sitemap data from CommerceTools GraphQL response
 * Filters products based on specific conditions:
 * - Has CTProductUrlComponent attribute
 * - Is not inactive
 * - Is set to display
 * - Has at least one price > 0
 * 
 * @param products - Array of GraphQL responses containing product data
 * @returns Array of objects with slug and lastModifiedAt properties
 */
export const buildSitemapResponseForCTProducts = (products: ClientResponse<GraphQLResponse>[]) => {
    const siteMapProducts: any = [];
    products.forEach((graphQlProducts: ClientResponse<GraphQLResponse>) => {
        if (graphQlProducts?.body?.data?.products?.results) {
            graphQlProducts?.body?.data?.products?.results?.forEach((product: any) => {
                const attributesRaw = product?.masterData?.current?.masterVariant?.attributesRaw;

                const hasValidPrice = product?.masterData?.current?.masterVariant?.prices?.some((price: any) =>
                    price?.value?.centAmount > 0
                );
                
                if (
                    attributesRaw?.find((attr: any) => attr?.name === 'CTProductUrlComponent')?.value
                    && attributesRaw?.find((attr: any) => attr?.name === 'isInactive')?.value === false
                    && attributesRaw?.find((attr: any) => attr?.name === 'isDisplay')?.value === true
                    && hasValidPrice
                ) {
                    siteMapProducts.push({
                        slug: attributesRaw?.find((attr: any) => attr?.name === 'CTProductUrlComponent')?.value || '',
                        lastModifiedAt: product?.lastModifiedAt || '',
                    });
                }
            });
        }
    });

    return siteMapProducts;
};

/**
 * Fetches products from CommerceTools API for sitemap generation
 * Uses pagination to fetch all products in batches of 500
 * 
 * @returns Array of GraphQL responses containing product data
 */
export const getCTProductsForSitemap = async () => {
    const adminClient = await getClient();
    const totalProduct = (await adminClient.products().get().execute()).body.total;
    let offset = 0;
    let tempOffset = 0;
    const promise = [];
    while (offset < Number(totalProduct)) {
        if (offset > 10000) {
            promise.push(
                adminClient
                    .graphql()
                    .post({
                        body: {
                            query: getCTProductsForSitemapQuery(),
                            variables: {
                                limit: 500,
                                offset: tempOffset,
                                sort: "createdAt desc"
                            },
                        },
                    })
                    .execute(),
            );
            tempOffset += 500;
        } else {
            promise.push(
                adminClient
                    .graphql()
                    .post({
                        body: {
                            query: getCTProductsForSitemapQuery(),
                            variables: {
                                limit: 500,
                                offset: offset,
                                sort: "createdAt asc"
                            },
                        },
                    })
                    .execute(),
            );
        }
        offset += 500;
    }
    const products = await Promise.all(promise);

    return products;
};