import axios from "axios";

export async function llmExtractFields(text: string) {

    const prompt = `
    You are an expert at reading contracts and extracting metadata.
    From the given contract text, extract and return a JSON object with the following keys:

    {
    "vendor_name": string,
    "products": [string],
    "effective_date": string (YYYY-MM-DD),
    "end_date": string (YYYY-MM-DD, if mentioned),
    "auto_renews": boolean,
    "renewal_term_months": number,
    "notice_period_days": number,
    "initial_term_months": number (default 12 if unspecified)
    }

    Rules:
    - Seller is the vendor
    - If something is missing, guess based on context or set it to null.
    - Products may appear as a list, SKU, or service names; return all as array of strings.
    - Dates may appear as “Effective on”, “Commencement Date”, “Termination Date”, or “Expires”.
    - Auto renewal: true if any phrase like “automatically renews”, “renewed annually”, “continues unless terminated”.
    - Return *only valid JSON* without explanations.
    `;


    const resp = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: text.slice(0, 10000) },
            ],
            response_format: { type: "json_object" },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );

    return JSON.parse(resp.data.choices[0].message.content);
}
