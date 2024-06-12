import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

export default async function downloadImage(url, output) {
    const maxRedirects = 5;
    
    async function getFinalUrl(currentUrl, redirectCount = 0) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(currentUrl);

            https.get(parsedUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    if (redirectCount >= maxRedirects) {
                        return reject(new Error('Too many redirects'));
                    }
                    const redirectUrl = new URL(response.headers.location, currentUrl).href;
                    resolve(getFinalUrl(redirectUrl, redirectCount + 1));
                } else {
                    resolve(response);
                }
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    try {
        const response = await getFinalUrl(url);

        const contentType = response.headers['content-type'];
        if (!validMimeTypes.includes(contentType)) {
            throw new Error('El archivo no es una imagen válida');
        }

        const extension = contentType.split('/')[1];
        const filePath = output;

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                fileStream.close();
                console.log('Imagen descargada correctamente:', filePath);
                resolve(filePath);
            });

            fileStream.on('error', (error) => {
                fs.unlink(filePath, () => {});  // Eliminar el archivo en caso de error
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error al descargar la imagen:', error.message);
        throw error;
    }
}

