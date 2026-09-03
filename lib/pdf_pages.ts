/**
 * Karez 2.0 - Client-side PDF page renderer
 *
 * Loads pdf.js from a CDN at runtime (no npm dependency, keeps the bundle
 * small and works inside AI Studio's build). Renders each page of an
 * uploaded PDF to a JPEG data URL so the extraction API can analyse the
 * whole document, not just page 1.
 */

const PDFJS_BASE =
  process.env.NEXT_PUBLIC_PDFJS_BASE ||
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build';

let pdfjsPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF rendering is only available in the browser.');
  }
  if (!pdfjsPromise) {
    pdfjsPromise = import(
      /* webpackIgnore: true */ `${PDFJS_BASE}/pdf.min.mjs`
    ).then((mod: any) => {
      const pdfjs = mod?.default || mod;
      pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return pdfjs;
    });
    pdfjsPromise.catch(() => {
      // Allow a retry on transient CDN failure
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

export interface RenderedPdf {
  /** JPEG data URLs, one per rendered page (capped at maxPages) */
  pageImages: string[];
  /** Total pages in the document (may exceed pageImages.length) */
  numPages: number;
}

/**
 * Renders up to maxPages pages of the given PDF file to JPEG data URLs.
 */
export async function renderPdfToImages(
  file: File | Blob,
  maxPages: number = 12,
  scale: number = 1.5,
  jpegQuality: number = 0.8
): Promise<RenderedPdf> {
  const pdfjs = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const numPages: number = doc.numPages;
  const pagesToRender = Math.min(numPages, Math.max(1, maxPages));
  const pageImages: string[] = [];

  for (let i = 1; i <= pagesToRender; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context for PDF rendering.');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageImages.push(canvas.toDataURL('image/jpeg', jpegQuality));
    page.cleanup?.();
  }

  doc.destroy?.();
  return { pageImages, numPages };
}

/**
 * Reads a File/Blob as a base64 data URL.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}
