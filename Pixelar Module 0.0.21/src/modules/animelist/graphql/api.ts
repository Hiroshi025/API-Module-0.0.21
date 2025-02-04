import fetch from "node-fetch"; // O simplemente usa globalThis.fetch

const API_URL = "https://graphql.anilist.co";

export const fetchGraphQL = async <T>(
    query: string,
    variables?: Record<string, unknown>
): Promise<{ data?: T; error?: string }> => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = (await response.json()) as { data?: T; errors?: { message: string }[] };

        if (result.errors) {
            return { error: result.errors[0].message };
        }

        return { data: result.data };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Unknown Error" };
    }
};
