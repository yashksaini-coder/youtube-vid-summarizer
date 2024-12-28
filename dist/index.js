"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const youtube_transcript_1 = require("youtube-transcript");
const groq_sdk_1 = require("groq-sdk");
// Load environment variables
require('dotenv').config();
const groq = new groq_sdk_1.Groq({ apiKey: process.env.GROQ_API_KEY });
/**
 * Fetches the transcript of a YouTube video in chunks to handle long videos.
 * @param videoUrl The URL of the YouTube video.
 * @param chunkSize The number of sentences per chunk.
 * @returns A promise resolving to an array of transcript chunks.
 */
function fetchTranscriptInChunks(videoUrl_1) {
    return __awaiter(this, arguments, void 0, function* (videoUrl, chunkSize = 10) {
        try {
            const transcriptData = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoUrl);
            const sentences = transcriptData.map((item) => item.text);
            // Split the sentences into chunks
            const chunks = [];
            for (let i = 0; i < sentences.length; i += chunkSize) {
                chunks.push(sentences.slice(i, i + chunkSize));
            }
            return chunks;
        }
        catch (error) {
            console.error("Error fetching transcript:", error);
            throw new Error("Failed to fetch transcript");
        }
    });
}
/**
 * Generates a detailed summary for each chunk of the transcript and combines the summaries into bullet points.
 * @param chunks The array of transcript chunks.
 * @returns A promise resolving to the combined summary string in bullet points.
 */
function generateSummaryForChunks(chunks) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const summaries = [];
            for (const chunk of chunks) {
                const prompt = `Provide a concise summary for the following transcript, structured as bullet points:\n\n${chunk.join(" ")}\n\nSummary:`;
                const response = yield groq.chat.completions.create({
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
                const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (content)
                    summaries.push(content.trim());
            }
            // Combine summaries into a single bullet-pointed list
            return summaries.map((summary) => `- ${summary}`).join("\n");
        }
        catch (error) {
            console.error("Error generating summary:", error);
            throw new Error("Failed to generate summary");
        }
    });
}
function transformSummary(summary) {
    const lines = summary.split("\n");
    // Filter out unnecessary lines and clean up formatting
    const cleanedLines = lines
        .filter((line) => !line.includes("Here is a concise summary of the transcript"))
        .map((line) => line.replace(/^- /, ""));
    // Combine cleaned lines into a readable paragraph format
    return cleanedLines.join(" ").replace(/\s+/g, " ").trim();
}
// Example usage
(() => __awaiter(void 0, void 0, void 0, function* () {
    const videoUrl = "https://www.youtube.com/watch?v=k0bBmv45bNQ";
    try {
        const chunks = yield fetchTranscriptInChunks(videoUrl);
        // console.log("Transcript Chunks:", chunks);
        const summary = yield generateSummaryForChunks(chunks);
        console.log("Combined Summary:", transformSummary(summary));
    }
    catch (error) {
        console.error("We encountered an error:", error);
    }
}))();
