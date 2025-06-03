import axios, { AxiosRequestConfig } from 'axios';
import { getAllRecipes } from './getRecipes.js';

export const getAllContentPages = async () => {
    try {
        const payload = {
            "excludedUrls": process.env.EXCLUDE_PATHS,
            "excludeBatch": process.env.EXCLUDE_FOLDER_PATHS
        }
        const config: AxiosRequestConfig = {
            method: 'POST',
            maxBodyLength: Infinity,
            url: `${process.env.FRONTASTIC_HOST}/action/sitemaps/content`,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'cofe-custom-configuration': '',
                'commercetools-frontend-extension-version': 'devsatya',
            },
            data: payload ?? {}
        };
        const contentPages = await axios.request(config)

        const recipePages = await getAllRecipes()

        const totalContentPages = (recipePages as any[]).concat(contentPages?.data?.contentPages);

        return totalContentPages;
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err)
        };
    }
};
