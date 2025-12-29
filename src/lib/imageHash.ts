/**
 * Simple perceptual image hash for duplicate detection.
 * Uses a downscaled grayscale average to generate a hash.
 * Two similar images will have similar hashes.
 */

const HASH_SIZE = 8; // 8x8 = 64 bit hash

/**
 * Generate a perceptual hash from an image blob.
 * Returns a hex string representing the image fingerprint.
 */
export async function generateImageHash(blob: Blob): Promise<string> {
    // Create an image from the blob
    const img = await createImageFromBlob(blob);

    // Create a small canvas for downscaling
    const canvas = document.createElement('canvas');
    canvas.width = HASH_SIZE;
    canvas.height = HASH_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Draw image scaled down to HASH_SIZE x HASH_SIZE
    ctx.drawImage(img, 0, 0, HASH_SIZE, HASH_SIZE);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
    const pixels = imageData.data;

    // Convert to grayscale values
    const grays: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
        // Standard grayscale conversion: 0.299*R + 0.587*G + 0.114*B
        const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        grays.push(gray);
    }

    // Calculate average
    const avg = grays.reduce((sum, val) => sum + val, 0) / grays.length;

    // Generate hash: each bit is 1 if pixel > average, 0 otherwise
    let hash = '';
    for (let i = 0; i < grays.length; i += 4) {
        let byte = 0;
        for (let j = 0; j < 4 && i + j < grays.length; j++) {
            if (grays[i + j] > avg) {
                byte |= (1 << j);
            }
        }
        hash += byte.toString(16);
    }

    // Cleanup
    URL.revokeObjectURL(img.src);

    return hash;
}

/**
 * Generate hashes for multiple image blobs.
 * Returns an array of hashes in the same order.
 */
export async function generateImageHashes(blobs: Blob[]): Promise<string[]> {
    return Promise.all(blobs.map(blob => generateImageHash(blob)));
}

/**
 * Combine multiple page hashes into a single receipt hash.
 * For multi-page PDFs, we concatenate individual hashes.
 */
export function combineHashes(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    // For multi-page receipts, use a combined hash
    return hashes.sort().join('-');
}

// Helper to create image from blob
function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}
