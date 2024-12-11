import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: "your-key",
});

export const transcribeAudio = async (audioPath: string): Promise<string> => {
    const audioFilePath = path.join(
        __dirname,
        "downloads",
        "saket_podcast.mp3"
      );
  const audioStream = fs.createReadStream(audioFilePath);
console.log(audioStream)
  try {
    const response = await openai.audio.translations.create({
      file: audioStream,
      model: "whisper-1",
    });
    console.log(response)

    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

