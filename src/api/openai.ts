export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

export const transcribeAudio = async (audioBase64: string) => {
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "whisper-1",
      audio: audioBase64,
    }),
  });

  const data = await res.json();
  return data.text;
};
