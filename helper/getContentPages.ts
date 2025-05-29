import { SDK, SDKResponse } from '@commercetools/frontend-sdk';
import { getAllRecipesQueryString } from './recipesFilterQuery.js';
import { getRecipesForPLP } from './getRecipes.js';
import { PageFolderListResponse } from '@commercetools/frontend-sdk/lib/types/api/page/PageFolderListResponse.js';

export const getAllContentPages = async () => {
    try {
        const pageSize = 100;
        const batchSize = 5; // Number of pages to fetch in parallel'

        const locale = 'en-AU';
        const sdk = new SDK();
        sdk.configure({
            locale,
            currency: 'AUD',
            extensionVersion: process.env.EXT_BUILD_ID ?? 'dev',
            endpoint: process.env.FRONTASTIC_HOST || '',
        });

        const recipePromises = new Promise((resolve, reject) => {
            (async () => {
                try {
                    let allData: any[] = [];
                    let hasMore = true;
                    let currentBatch = 1;

                    while (hasMore) {
                        // Create promises for current batch of pages
                        const batchPromises = Array.from({ length: batchSize }, (_, i) => {
                            const page = (currentBatch - 1) * batchSize + i + 1;
                            console.log("****************** page::", page);
                            return getAllRecipesQueryString({ page, pageSize }, pageSize)
                                .then((query: string[] | undefined): Promise<any[]> =>
                                    query?.[0]
                                        ? getRecipesForPLP(query[0])
                                        : Promise.resolve([])
                                );
                        });

                        console.log("****************** batchPromisesCount::", batchPromises.length);
                        const batchResults = await Promise.all(batchPromises);
                        const batchData = batchResults.flat();
                        allData = [...allData, ...batchData];

                        console.log("****************** allData::", allData.length);
                        console.log("****************** batchData::", batchData.length);
                        hasMore = batchData.length === batchSize * pageSize;
                        console.log("****************** hasMore::", hasMore);
                        currentBatch++;
                    }

                    const simplifiedData = allData.map(recipe => ({
                        slug: recipe.url,
                        lastModifiedAt: recipe.lastModifiedAt || null
                    }));
                    resolve(simplifiedData);
                } catch (error: any) {
                    console.log("**** error while fetching recipes from builder::", JSON.stringify({ message: error.message, stack: error.stack }))
                    resolve([]);
                }
            })();
        });
        // const includesUrls = String(process.env.INCLUDE_PATHS)?.split(',');
        // const includesFolders = String(process.env.FOLDER_PATHS)?.split(',');
        // const data = [...includesUrls, ...includesFolders];
        const path = '/blog'
        const contentPagesPromise = sdk.page.getPages();

        const [recipePages, blogPagesResponse] = await Promise.all([
            recipePromises,
            contentPagesPromise
        ]);
        console.log("CONTENT", (blogPagesResponse as any)?.data?.pageFolderStructure)
        // Extract pages from the response
        const blogPages = (blogPagesResponse as any).data?.pageFolderStructure
            ?.filter((folder: any) => {
                const url = folder._url;
                // Include only URLs that start with /blog/articles or /blog/buying-guides
                return (url.startsWith('/blog/articles/') || url.startsWith('/blog/buying-guides/'))
                    && url !== '/blog/articles'
                    && url !== '/blog/buying-guides';
            })
            .map((folder: any) => ({
                slug: folder._url,
                lastModifiedAt: folder.pageFolderUpdatedAt?.split('T')[0] || null
            })) || [];

        console.log("BLOG", blogPages);
        const contentPages = (recipePages as any[]).concat(blogPages);

        return contentPages;
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err)
        };
    }
};
