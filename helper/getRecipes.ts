import axios from "axios";
import { BuilderResult, RecipeDetails, RecipeSitemapList } from "types/recipes.js";
import { getAllRecipesQueryString } from "./recipesFilterQuery.js";

export const getAllRecipes = async (): Promise<RecipeSitemapList[] | { statusCode: number; body: string }> => {
    try {
        const pageSize = 100;
        const batchSize = 5;

        const recipePromises = new Promise<RecipeSitemapList[]>((resolve, reject) => {
            (async () => {
                try {
                    let allData: RecipeDetails[] = [];
                    let hasMore = true;
                    let currentBatch = 1;

                    while (hasMore) {
                        // Create promises for current batch of pages
                        const batchPromises = Array.from({ length: batchSize }, (_, i) => {
                            const page = (currentBatch - 1) * batchSize + i + 1;
                            return getAllRecipesQueryString({ page, pageSize }, pageSize)
                                .then((query: string[] | undefined): Promise<RecipeDetails[]> =>
                                    query?.[0]
                                        ? getRecipesForPLP(query[0])
                                        : Promise.resolve([])
                                );
                        });

                        const batchResults = await Promise.all(batchPromises);
                        const batchData = batchResults.flat();
                        allData = [...allData, ...batchData];

                        hasMore = batchData.length === batchSize * pageSize;
                        currentBatch++;
                    }

                    const simplifiedData = allData.map((recipe: RecipeDetails) => ({
                        slug: recipe.url,
                        lastModifiedAt: recipe.lastModifiedAt || null
                    })) as RecipeSitemapList[];

                    resolve(simplifiedData);
                } catch (error: any) {
                    resolve([]);
                }
            })();
        });
        const recipes = await recipePromises;
        return recipes;
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err),
        };
    }
};

export const getRecipesForPLP = async (filterQuery: string): Promise<RecipeDetails[]> => {
    try {
        const url = `${process.env.BUILDER_REST_URL}/v3/content/recipes?apiKey=${process.env.BUILDER_APIKEY}&${filterQuery}`;

        const response = await axios.get(url);
        const data = response?.data?.results?.map((data: BuilderResult) => {
            const mainData = data?.data;
            const lastModifiedAt = new Date(Number(data?.lastUpdated)).toISOString() as any;
            return { ...mainData, lastModifiedAt: lastModifiedAt?.split('T')[0] };
        }) as RecipeDetails[];

        return data || [];
    } catch (err) {
        return [];
    }
};