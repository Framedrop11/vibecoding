import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { decode as atob, encode as btoa } from "base-64";


const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

export default function VisionNarrator() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState("Take a photo to begin.");
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<any>(null);

  // CAMERA PERMISSIONS (NEW API)
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    Audio.requestPermissionsAsync(); // also request audio playback perms
  }, [permission]);

  if (!permission?.granted) {
    return <Text style={{ color: "white", marginTop: 50 }}>No camera permission</Text>;
  }

  async function takePicture() {
    if (!cameraRef.current) return;

    const pic = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
    });

    setPhoto(pic.uri);
    setDescription("Analyzing image...");

    const desc = await analyzeImage(pic.base64);
    setDescription(desc);

    await speakText(desc);
  }

  async function analyzeImage(base64Image?: string) {
    if (!base64Image) return "Error capturing image.";

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: "Describe this image in detail for a visually impaired user.",
                  },
                  {
                    type: "input_image",
                    image_url: `data:image/jpeg;base64,${base64Image}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data?.choices?.length > 0) {
        return data.choices[0].message.content;
      }
      return "Could not analyze the image.";
    } catch (err) {
      console.error("Vision Error:", err);
      return "Image analysis error.";
    }
  }

  async function speakText(text: string) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: text,
        }),
      });

      // Read audio into an ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer → base64 WITHOUT Buffer (React Native-safe)
      const binaryString = String.fromCharCode(...new Uint8Array(arrayBuffer));
      const base64Audio = btoa(binaryString);

      // Save file locally
      const fileUri = FileSystem.cacheDirectory + "tts_audio.mp3";
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play audio
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: fileUri });
      await soundObject.playAsync();
    } catch (err) {
      console.error("TTS Error:", err);
    }
  }


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vision Narrator</Text>

      {!photo ? (
        <CameraView
          style={styles.camera}
          facing="back"
          ref={(ref) => (cameraRef.current = ref)}
          onCameraReady={() => setCameraReady(true)}
        />
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}

      <Text style={styles.description}>{description}</Text>

      {!photo ? (
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={takePicture}
          disabled={!cameraReady}
        >
          <Text style={styles.btnText}>Capture</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setPhoto(null);
            setDescription("Take a photo to begin.");
          }}
        >
          <Text style={styles.btnText}>Retake</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 20,
  },
  header: {
    color: "#00eaff",
    fontSize: 28,
    marginBottom: 10,
    alignSelf: "center",
    fontWeight: "600",
  },
  camera: {
    width: "100%",
    height: "50%",
    borderRadius: 12,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "50%",
    borderRadius: 12,
  },
  description: {
    color: "#fff",
    marginVertical: 20,
    fontSize: 18,
    lineHeight: 22,
  },
  captureBtn: {
    backgroundColor: "#00b4ff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  resetBtn: {
    backgroundColor: "#ff004c",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
  },
});
