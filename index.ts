import { YoutubeTranscript } from 'youtube-transcript';
import { Groq } from 'groq-sdk';

// Load environment variables
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Fetches the transcript of a YouTube video in chunks to handle long videos.
 * @param videoUrl The URL of the YouTube video.
 * @param chunkSize The number of sentences per chunk.
 * @returns A promise resolving to an array of transcript chunks.
 */
async function fetchTranscriptInChunks(videoUrl: string, chunkSize: number = 10): Promise<string[][]> {
    try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoUrl);
        const sentences = transcriptData.map((item: { text: string }) => item.text);

        // Split the sentences into chunks
        const chunks: string[][] = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
            chunks.push(sentences.slice(i, i + chunkSize));
        }

        return chunks;
    } catch (error) {
        console.error("Error fetching transcript:", error);
        throw new Error("Failed to fetch transcript");
    }
}

/**
 * Generates a detailed summary for each chunk of the transcript and combines the summaries into bullet points.
 * @param chunks The array of transcript chunks.
 * @returns A promise resolving to the combined summary string in bullet points.
 */
async function generateSummaryForChunks(chunks: string[][]): Promise<string> {
    try {
        const summaries: string[] = [];

        for (const chunk of chunks) {
            const prompt = `Provide a concise summary for the following transcript, structured as bullet points:\n\n${chunk.join(" ")}\n\nSummary:`;

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: "llama3-70b-8192",
            });

            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error("No response from Groq");
            }

            const content = response.choices[0]?.message?.content;
            if (content) summaries.push(content.trim());
        }

        // Combine summaries into a single bullet-pointed list
        return summaries.map((summary) => `- ${summary}`).join("\n");
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary");
    }
}

function transformSummary(summary: string): string {
    const lines = summary.split("\n");

    // Filter out unnecessary lines and clean up formatting
    const cleanedLines = lines
        .filter((line) => !line.includes("Here is a concise summary of the transcript"))
        .map((line) => line.replace(/^- /, ""));

    // Combine cleaned lines into a readable paragraph format
    return cleanedLines.join(" ").replace(/\s+/g, " ").trim();
}

// Example usage
(async () => {
    const videoUrl = "https://www.youtube.com/watch?v=k0bBmv45bNQ";

    try {
        const chunks = await fetchTranscriptInChunks(videoUrl);
        // console.log("Transcript Chunks:", chunks);

        const summary = await generateSummaryForChunks(chunks);
        console.log("Combined Summary:", transformSummary(summary));
    } catch (error) {
        console.error("We encountered an error:", error);
    }
})();