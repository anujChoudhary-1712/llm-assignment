import { Request, Response } from "express";
import { downloadFile, extractAudio } from "../utils/fileHandler";
import axios from "axios";
import path from "path";
import { transcribeAudio } from "../utils/assembly";

// Retry function to handle transient errors like ECONNRESET
const retryRequest = async (
  fn: Function,
  retries: number = 3,
  delay: number = 2000
): Promise<any> => {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError; // If all attempts fail, throw the last error
};

export const processTranscript = async (req: Request, res: any) => {
  try {
    const { fileUrl } = req.body; // URL of the file (YouTube, Google Drive, or direct link)

    if (!fileUrl) {
      return res.status(400).json({ error: "File URL is required." });
    }

    // Step 1: Download the file
    // const downloadedFilePath = await downloadFile();
    // console.log("downloaded path", downloadedFilePath);

    // Step 2: Convert to audio if needed
    // const audioFilePath = await extractAudio(downloadedFilePath ?? "");

    // Step 3: Transcribe the audio with retry logic
    // Using the saket_podcast.mp3 file from the downloads directory
    const transcript = await retryRequest(() => transcribeAudio(""));

    // Step 4: Segment the transcript into questions and answers
    const segments = await segmentTranscript(transcript);

    // Step 5: Identify editing opportunities and build a table
    const editingSuggestions = generateEditingTable(segments);

    // Step 6: Send the response
    res.status(200).json({
      transcript,
      segments,
      editingSuggestions,
    });
  } catch (error) {
    console.error("Error processing transcript:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper functions (same as before)
async function segmentTranscript(transcript: string) {
  const segments: { timestamp: string; content: string }[] = [];
  
  // Call Assembly LLM for segmenting questions and answers from the transcript
  const response = await axios.post("YOUR_ASSEMBLY_LLM_API_ENDPOINT", {
    prompt: `You are given a transcript from a video. Your task is to identify and segment the transcript into questions and answers, ensuring that the integrity is maintained. Additionally, identify any parts of the transcript that should be removed for brevity and provide reasons for removal. Maintain a table with timestamps and reasons for inclusion/removal.
Here is the transcript:
${transcript}`,
  });

  // Assuming the response from Assembly LLM has a structure like this:
  const segmentsData = response.data.segments;

  // Process the segments data from Assembly LLM (adjust as needed based on actual API response structure)
  segmentsData.forEach((segment: { timestamp: string, content: string }) => {
    segments.push({
      timestamp: segment.timestamp,
      content: segment.content.trim(),
    });
  });

  return segments;
}

// Function to generate a table of timestamps to keep and remove
function generateEditingTable(segments: { timestamp: string; content: string }[]) {
  const tableToKeep: { timestamp: string, reason: string }[] = [];
  const tableToRemove: { timestamp: string, reason: string }[] = [];

  segments.forEach(segment => {
    const reason = determineReason(segment.content);
    if (reason.startsWith("Keep")) {
      tableToKeep.push({
        timestamp: segment.timestamp,
        reason: reason.replace("Keep: ", ""),
      });
    } else if (reason.startsWith("Remove")) {
      tableToRemove.push({
        timestamp: segment.timestamp,
        reason: reason.replace("Remove: ", ""),
      });
    }
  });

  return { tableToKeep, tableToRemove };
}

// Function to determine the reason for keeping or removing a segment
function determineReason(content: string): string {
  if (content.toLowerCase().includes("important") || content.length > 50) {
    return "Keep: Valuable information.";
  } else if (content.length < 20 || content.toLowerCase().includes("um") || content.toLowerCase().includes("ah")) {
    return "Remove: Too short or irrelevant.";
  }
  return "Keep: Relevant content.";
}