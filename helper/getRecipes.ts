import axios from "axios";
import { BuilderResult, RecipeDetails } from "types/recipes.js";
import { getAllRecipesQueryString } from "./recipesFilterQuery.js";

export const getAllRecipes= async () => {
    try {
        const pageSize = 100;
        const batchSize = 5; // Number of pages to fetch in parallel
        let allData: any[] = [];
        let currentBatch = 1;
        let hasMore = true;

        while (hasMore) {
            // Create promises for current batch of pages
            const batchPromises = Array.from({ length: batchSize }, async (_, i) => {
                const page = (currentBatch - 1) * batchSize + i + 1;
                console.log("****************** page::", page)
                const query = await getAllRecipesQueryString({ page, pageSize }, pageSize);
                return await (
                    query?.[0] ? getRecipesForPLP(query[0]) : Promise.resolve([]));
            });

            // Fetch current batch in parallel
            const batchResults = await Promise.all(batchPromises);
            const batchData = batchResults.flat();
            allData = [...allData, ...batchData];

            console.log("****************** allData::", allData.length);
            console.log("****************** batchData::", batchData.length);
            // If we got less than expected (batchSize * pageSize), we have all recipes
            hasMore = batchData.length === batchSize * pageSize;
            console.log("****************** hasMore::", hasMore)
            currentBatch++;
        }

        // Transform the data to only include required fields
        const simplifiedData = allData.map(recipe => ({
            title: recipe.recipeTitle,
            url: recipe.url,
            createdDate: recipe.recordCreatedDate ? new Date(recipe.recordCreatedDate).toISOString().split('T')[0] : null,
            prepTimeInMinutes: recipe.prepTimeInMinutes,
            cookingTimeInMinutes: recipe.cookingTimeInMinutes
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                total: simplifiedData.length,
                data: simplifiedData,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err),
        }
    }
};

export const getRecipesForPLP = async (filterQuery: string): Promise<RecipeDetails[]> => {
    try {
        const url = `${process.env.BUILDER_REST_URL}/v3/content/recipes?apiKey=${process.env.BUILDER_APIKEY}&${filterQuery}`;

        const response = await axios.get(url);
        const data = response?.data?.results?.map((data: BuilderResult) => {
            const mainData = data?.data;
            const lastModifiedAt = new Date(Number(data?.lastUpdated )* 1000)
            return { ...mainData, lastModifiedAt: lastModifiedAt.toISOString().split('T')[0] };
        }) as RecipeDetails[];

        return data as RecipeDetails[];
    } catch (err) {
        console.log("Error at Recipie List...!", err);
        return [] as RecipeDetails[]
    }
}