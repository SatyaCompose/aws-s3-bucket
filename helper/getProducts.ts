import { ClientResponse, GraphQLResponse } from "@commercetools/platform-sdk";
import { buildSitemapResponseForCTProducts, getCTProductsForSitemap } from "./buildProdutUrlList";

export const getCTProducts = async () => {
    try {
        const products = await getCTProductsForSitemap() as ClientResponse<GraphQLResponse>[];
        const ctProducts = await buildSitemapResponseForCTProducts(products);
        return ctProducts;
    } catch (err: any) {
        return {
            statusCode: err?.statusCode || 500,
            body: typeof err === 'string' ? err : JSON.stringify(err),
        };
    }
};
