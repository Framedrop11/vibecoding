import { Camera } from 'expo-camera';
import { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';

export default function CameraTest() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  if (hasPermission === null) return <Text>Requesting permissions...</Text>;
  if (hasPermission === false) return <Text>No access to camera/microphone</Text>;

  return (
    <View>
      <Text>Camera + Microphone Permissions OK</Text>
    </View>
  );
}
