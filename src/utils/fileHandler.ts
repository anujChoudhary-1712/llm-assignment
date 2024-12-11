import ytdl from "ytdl-core";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Download file (YouTube, Google Drive, or direct link)
export const downloadFile = async () => {
  const filePath = "./downloads/saket_podcast.mp4"; // Path to your video file

  if (!fs.existsSync(filePath)) {
    console.error("File does not exist at path", filePath);
    throw new Error("File not found");
  }

  return filePath;
};

// Extract the file ID from a Google Drive URL
const extractGoogleDriveFileId = (url: string): string => {
  const regex = /(?:drive|docs)\.google\.com.*(?:id=|\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Invalid Google Drive URL");
};
// Download a Google Drive file
const downloadGoogleDriveFile = async (url: string, filePath: string): Promise<string> => {
  try {
    // Extract the file ID
    const fileId = extractGoogleDriveFileId(url);
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Send GET request to Google Drive file
    const response = await axios.get(downloadUrl, { responseType: "stream" });

    const writeStream = fs.createWriteStream(filePath);
    response.data.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log("File downloaded from Google Drive");
        resolve(filePath);
      });
      writeStream.on("error", (err) => {
        console.error("Error downloading file from Google Drive", err);
        reject(err);
      });
    });
  } catch (error:any) {
    throw new Error(`Failed to download Google Drive file: ${error.message}`);
  }
};

// Extract audio from video using ffmpeg
export const extractAudio = (filePath: string): Promise<string> => {
  const audioPath = filePath.replace(path.extname(filePath), ".mp3"); // Output audio path

  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegStatic ?? "") // Set ffmpeg path to ffmpeg-static binary
      .input(filePath)
      .audioCodec('libmp3lame') // Audio codec for mp3
      .audioBitrate(128) // Set audio bitrate
      .save(audioPath) // Save the extracted audio to the specified path
      .on('end', () => {
        console.log(`Audio extracted successfully to ${audioPath}`);
        resolve(audioPath);
      })
      .on('error', (err: any) => {
        console.error("Error extracting audio:", err);
        reject(err);
      });
  });
};