declare module "pdf-parse/lib/pdf-parse.js" {
    const pdfParse: (dataBuffer: Buffer, options?: any) => Promise<{
        text: string;
        numpages: number;
        numrender: number;
        info: Record<string, any>;
        metadata: Record<string, any>;
        version: string;
    }>;
    export default pdfParse;
}
