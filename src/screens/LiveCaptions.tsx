import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";


const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

export default function LiveCaption() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [caption, setCaption] = useState<string>("Press record to begin.");
  const isRecording = useRef(false);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission denied.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);


      await recording.startAsync();

      setRecording(recording);
      isRecording.current = true;
      setCaption("Listening...");
    } catch (err) {
      console.error("Recording error:", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setCaption("Processing...");

        if (!uri) {
          setCaption("Error: No audio file found.");
          return;
        }

        const transcription = await transcribeAudio(uri);
        setCaption(transcription || "Could not transcribe audio.");

      setRecording(null);
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  }

  async function transcribeAudio(uri: string) {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "audio.m4a",
      } as any);

      formData.append("model", "whisper-large-v3");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Groq Whisper Response:", data);

      if (data.error) {
        return "ERROR: " + data.error.message;
      }

      return data.text;
    } catch (err) {
      console.error("Groq Transcription Error:", err);
      return "ERROR: " + err.toString();
    }
  }






  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Captions</Text>
      <View style={styles.captionBox}>
        <Text style={styles.caption}>{caption}</Text>
      </View>

      {!isRecording.current ? (
        <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
          <Text style={styles.btnText}>Start Recording</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
          <Text style={styles.btnText}>Stop Recording</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontSize: 28,
    color: "#00eaff",
    fontWeight: "700",
    marginBottom: 20,
  },
  captionBox: {
    width: "100%",
    minHeight: 120,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#00eaff",
    marginBottom: 30,
  },
  caption: {
    color: "#fff",
    fontSize: 18,
  },
  recordBtn: {
    backgroundColor: "#0099ff",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  stopBtn: {
    backgroundColor: "#ff0033",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
  },
});
