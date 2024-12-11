import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import path from "path";

// Your AssemblyAI API key
const client = new AssemblyAI({
  apiKey: 'dc207a0a15c04f2ea72f7148f13e8c01',
});

const AUDIO_FILE_PATH = path.join(
    __dirname,
    "downloads",
    "saket_podcast.mp3"
  );

// Upload audio file to AssemblyAI
const uploadAudio = async (audioFilePath:string) => {
  const form = new FormData();
  form.append('audio', fs.createReadStream(audioFilePath));

  try {
    const response = await axios.post('https://api.assemblyai.com/v2/upload', form, {
      headers: {
        ...form.getHeaders(),
        authorization:'dc207a0a15c04f2ea72f7148f13e8c01'
      },
    });

    return response.data.upload_url;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

export const transcribeAudio = async (audioUrl: string): Promise<string> => {
  try {
    // const audioUrl = await uploadAudio(AUDIO_FILE_PATH);
    // console.log('Audio uploaded successfully. URL:', audioUrl);

    // Step 1: Request transcription
    const transcriptionRequest = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: "https://cdn.assemblyai.com/upload/54d458ea-fc0a-4902-90cb-be82d3446246" },
      {
        headers: {
          authorization: 'dc207a0a15c04f2ea72f7148f13e8c01',
        },
      }
    );

    console.log("tr_reques",transcriptionRequest)

    const transcriptId = transcriptionRequest.data.id;
    console.log('Transcript ID:', transcriptId);

    // Step 2: Check transcription status
    const getTranscriptStatus = async () => {
      const statusResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: 'dc207a0a15c04f2ea72f7148f13e8c01',
          },
        }
      );
      console.log("statusresponse",statusResponse)
      return statusResponse.data;
    };

    // Step 3: Poll the transcription status until it's completed
    let status = await getTranscriptStatus();
    while (status.status !== 'completed') {
      console.log('Transcription in progress...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
      status = await getTranscriptStatus();
    }

    // Step 4: Return the transcript text
    return status.text || '';
  } catch (error) {
    console.error("Error during transcription:", error);
    throw new Error("Error during transcription process.");
  }
};
