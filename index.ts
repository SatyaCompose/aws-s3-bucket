import { S3 } from 'aws-sdk';
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import * as xmlbuilder from 'xmlbuilder';
import { getCTProducts } from './helper/getProducts';
import { ctCategorySitemapData } from './helper/getCategories';
import { CategorySitemapData } from './types/category';
import { getAllContentPages } from './helper/getContentPages';
/**
 * AWS Lambda function that creates a sitemap XML file and uploads it to an S3 bucket.
 * 
 * @param event - The event object
 * @param context - The Lambda context object
 * @returns Promise containing status code and response message
*/
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const { s3Client, bucketName } = await checkS3Bucket() as { s3Client: S3, bucketName: string };

        const productURLs = await getCTProducts();
        const categoriesList = await ctCategorySitemapData() as CategorySitemapData[];
        const contentPages = await getAllContentPages();

        const productXML = await createProductXML(s3Client, productURLs, bucketName);
        const categorysXML = await createCategoriesXML(s3Client, categoriesList, bucketName);
        const contentPagesXML = await createContentPagesXML(s3Client, contentPages, bucketName);
        console.log("CONTENT PAGES", contentPages)
        return {
            statusCode: 200,
            body: JSON.stringify({})
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating sitemap XML file',
                error: error instanceof Error ? error.message : String(error)
            })
        };
    }
};

const checkS3Bucket = async() => {
    try{
        const s3Client = new S3();
        const bucketName = process.env.S3_BUCKET_NAME;

        if (!bucketName) {
            throw new Error('S3_BUCKET_NAME environment variable is not set');
        }

        try {
            await s3Client.headBucket({ Bucket: bucketName }).promise();
        } catch (bucketError: any) {
            if (bucketError.code === 'NotFound' || bucketError.code === 'NoSuchBucket') {
                throw new Error(`S3 bucket '${bucketName}' does not exist. Please create it first.`);
            } else {
                throw new Error(`Error accessing S3 bucket: ${bucketError.message}`);
            }
        }
        return { s3Client, bucketName };
    }catch(err){
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating sitemap XML file',
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }
}

const createProductXML = async (s3Client: S3, productURLs:any, bucketName: string)  => {
    try{
        const root = xmlbuilder.create('urlset', {
            version: '1.0',
            encoding: 'UTF-8'
        }).att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        productURLs.forEach((product: any) => {
            const urlPath = String(product?.slug).startsWith('/') ? product.slug : `/${product.slug}`;
            const urlElement = root.ele('url');
            urlElement.ele('loc', `${process.env.WEB_URL}${urlPath}`);
            const lastmod = product.lastModifiedAt?.split('T')[0];
            urlElement.ele('lastmod', lastmod);
            urlElement.ele('changefreq', 'daily');
            urlElement.ele('priority', '0.8');
        });

        const xmlContent = root.end({ pretty: true });

        const fileName = `sitemap-product-pages.xml`;

        return await s3Client.putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: xmlContent,
            ContentType: 'application/xml'
        }).promise();
    }catch(error){
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating sitemap XML file',
                error: error instanceof Error ? error.message : String(error)
            })
        };
    }
}

const createCategoriesXML = async (s3Client: S3, categoriesList: any, bucketName: string) => {
    try{
        let skippedNoProducts = 0;
        const root = xmlbuilder.create('urlset', {
            version: '1.0',
            encoding: 'UTF-8'
        }).att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        categoriesList.forEach((category: any) => {
            if (!category.productCount || category.productCount <= 0) {
                skippedNoProducts++;
                console.log(`Skipping category with no products: ${category.slug}`);
                return;
            }

            if (!category.slug) {
                return;
            }
            const currentDate = Date.now();

            const categorySlug = category.slug.startsWith('/') ? category.slug : `/${category.slug}`;

            const lastmod = category.lastModifiedAt
                ? new Date(category.lastModifiedAt).toISOString().split('T')[0]
                : currentDate;

            const urlElement = root.ele('url');
            urlElement.ele('loc', `${process.env.WEB_URL}${categorySlug}`);
            urlElement.ele('lastmod', lastmod);
            urlElement.ele('changefreq', 'daily');
            urlElement.ele('priority', '0.9');

            const pageCount = category.pageCount || 1;

            for (let page = 2; page <= pageCount; page++) {
                const paginatedUrlElement = root.ele('url');
                paginatedUrlElement.ele('loc', `${process.env.WEB_URL}${categorySlug}?p=${page}`);
                paginatedUrlElement.ele('lastmod', lastmod);
                paginatedUrlElement.ele('priority', '0.9');
            }
        });

        const xmlContent = root.end({ pretty: true });

        const fileName = `sitemap-product-list-pages.xml`;

        return await s3Client.putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: xmlContent,
            ContentType: 'application/xml'
        }).promise();
    }catch(error){
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating sitemap XML file',
                error: error instanceof Error ? error.message : String(error)
            })
        };
    }
}

const createContentPagesXML = async (s3Client: S3, contentPages: any, bucketName: string) => {
    try{
        const root = xmlbuilder.create('urlset', {
            version: '1.0',
            encoding: 'UTF-8'
        }).att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

        contentPages.forEach((page: any) => {
            const urlPath = String(page?.slug).startsWith('/') ? page.slug : `/${page.slug}`;
            const urlElement = root.ele('url');
            urlElement.ele('loc', `${process.env.WEB_URL}${urlPath}`);
            const lastmod = page.lastModifiedAt;
            urlElement.ele('lastmod', lastmod);
            urlElement.ele('changefreq', 'weekly');

            if (String(page?.slug).includes('blog/recipes/')){
                urlElement.ele('priority', '0.6');
            }else{
                urlElement.ele('priority', '0.5');
            }
        });

        const xmlContent = root.end({ pretty: true });

        const fileName = `sitemap-content-pages.xml`;

        return await s3Client.putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: xmlContent,
            ContentType: 'application/xml'
        }).promise();
    }catch(error){
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating sitemap XML file',
                error: error instanceof Error ? error.message : String(error)
            })
        };
    }
};