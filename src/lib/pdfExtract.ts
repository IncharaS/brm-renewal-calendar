"use server";

export async function extractTextWithRetries(buffer: Buffer, file_name: string, maxAttempts = 5): Promise<string> {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(` [4.${attempt}] Parsing attempt ${attempt}/${maxAttempts}...`);
        try {
            // --- Primary extraction with pdf-parse ---
            const pdf = await import("pdf-parse/lib/pdf-parse.js");
            const parsePDF = pdf.default || pdf;
            const data = await parsePDF(buffer, { max: 0, version: "default" });

            if (data.text && data.text.trim().length > 100) {
                console.log(`[4.${attempt}] Extracted ${data.text.length} chars`);
                return data.text;
            } else {
                console.warn(`⚠️ [4.${attempt}] Very short text (${data.text.length} chars)`);
            }
        } catch (err: any) {
            console.warn(`⚠️ [4.${attempt}] pdf-parse failed: ${err.message}`);

            // --- Handle corrupted or signed PDFs (DocuSign, LinkedIn, etc.) ---
            if (err.message?.includes("XRef") || err.message?.includes("FormatError")) {
                try {
                    console.log(` [4.${attempt}] Attempting pdfjs-dist recovery...`);
                    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
                    const loadingTask = pdfjsLib.getDocument({
                        data: buffer,
                        verbosity: 0,
                        stopAtErrors: false,
                    });
                    const pdfDocument = await loadingTask.promise;
                    console.log(` [4.${attempt}] PDF loaded with ${pdfDocument.numPages} pages`);

                    let recoveredText = "";
                    for (let i = 1; i <= pdfDocument.numPages; i++) {
                        try {
                            const page = await pdfDocument.getPage(i);
                            const content = await page.getTextContent();
                            recoveredText += content.items.map((item: any) => item.str).join(" ") + "\n";
                        } catch {
                            console.warn(` [4.${attempt}] Failed extracting page ${i}`);
                        }
                    }

                    if (recoveredText.trim().length > 50) {
                        console.log(`[4.${attempt}] Recovered ${recoveredText.length} chars`);
                        return recoveredText;
                    }
                } catch (fallbackErr: any) {
                    console.warn(` [4.${attempt}] pdfjs-dist recovery failed: ${fallbackErr.message}`);
                }
            } else {
                console.warn(` [4.${attempt}] Non-recoverable parsing error.`);
            }
        }

        if (attempt < maxAttempts) {
            const waitTime = 500 * attempt;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
        }
    }

    console.warn(" All parsing attempts failed.");
    return "";
}
