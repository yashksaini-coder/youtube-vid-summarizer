interface VideoSummary {
    summary: string;
    videoUrl: string;
    timestamp: string;
}

interface ApiResponse {
    success: boolean;
    data: VideoSummary;
    error?: string;
}

async function fetchVideoSummary(videoUrl: string): Promise<VideoSummary> {
    try {
        const response = await fetch('http://localhost:3000/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoUrl }),
        });

        const data: ApiResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch summary');
        }

        // Store the result in a local file
        const result = {
            ...data.data,
            timestamp: new Date().toISOString(),
        };

        await storeResult(result);
        console.log('Summary:', result.summary);
        return result;
    } catch (error) {
        console.error('Error fetching summary:', error);
        throw error;
    }
}

async function storeResult(result: VideoSummary): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const storePath = path.join(__dirname, 'summaries');
    const fileName = `summary-${Date.now()}.json`;

    try {
        await fs.mkdir(storePath, { recursive: true });
        await fs.writeFile(
            path.join(storePath, fileName),
            JSON.stringify(result, null, 2)
        );
        console.log(`Result stored in ${fileName}`);
    } catch (error) {
        console.error('Error storing result:', error);
        throw error;
    }
}

// Example usage
fetchVideoSummary('https://www.youtube.com/watch?v=4XeewqMkwxM');
