import { S3 } from 'aws-sdk';
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import * as xmlbuilder from 'xmlbuilder';
import { getCTProducts } from './helper/getProducts';
/**
 * AWS Lambda function that creates a sitemap XML file and uploads it to an S3 bucket.
 * 
 * @param event - The event object
 * @param context - The Lambda context object
 * @returns Promise containing status code and response message
*/
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
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

        const currentDate = Date.now();

        const productURLs = await getCTProducts();

        const root = xmlbuilder.create('urlset', {
            version: '1.0',
            encoding: 'UTF-8'
        }).att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

        productURLs.forEach((product: any) => {
            const urlPath =  String(product?.slug).startsWith('/') ? product.slug : `/${product.slug}`;
            const urlElement = root.ele('url');
            urlElement.ele('loc', `https://kwh-kitchenwarehouse.netlify.app${urlPath}`);
            const lastmod = product.lastModifiedAt?.split('T')[0];
            urlElement.ele('lastmod', lastmod);
            urlElement.ele('priority', '0.8');
        });

        const xmlContent = root.end({ pretty: true });

        const fileName = `sitemap.xml`;

        const data = await s3Client.putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: xmlContent,
            ContentType: 'application/xml'
        }).promise();

        const xml = await s3Client.getObject({ Bucket: bucketName, Key: fileName }).promise() as S3.GetObjectOutput;

        return {
            statusCode: 200,
            body: JSON.stringify({data: xml?.Body as S3.Body})
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