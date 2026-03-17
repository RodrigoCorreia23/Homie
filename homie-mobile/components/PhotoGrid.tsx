import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImage } from '../services/upload.service';
import { COLORS } from '../utils/constants';

interface Photo {
  id?: string;
  url: string;
  position: number;
}

interface PhotoGridProps {
  photos: Photo[];
  maxPhotos: number;
  folder: string;
  onPhotoAdded: (url: string, position: number) => Promise<void>;
  onPhotoRemoved: (photoId: string) => Promise<void>;
}

export default function PhotoGrid({
  photos,
  maxPhotos,
  folder,
  onPhotoAdded,
  onPhotoRemoved,
}: PhotoGridProps) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return;

    setUploading(true);
    try {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const { url } = await uploadImage(base64, folder);
      const nextPosition = photos.length;
      await onPhotoAdded(url, nextPosition);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return;

    setUploading(true);
    try {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const { url } = await uploadImage(base64, folder);
      const nextPosition = photos.length;
      await onPhotoAdded(url, nextPosition);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    Alert.alert('Adicionar foto', 'Escolhe uma opção', [
      { text: 'Câmara', onPress: takePhoto },
      { text: 'Galeria', onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleRemove = (photo: Photo) => {
    if (!photo.id) return;
    Alert.alert('Remover foto', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => onPhotoRemoved(photo.id!),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {photos.map((photo, i) => (
          <View key={photo.id || i} style={[styles.photoCell, i === 0 && styles.photoCellMain]}>
            <Image source={{ uri: photo.url }} style={styles.photo} />
            {photo.id && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(photo)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
            {i === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Principal</Text>
              </View>
            )}
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={[styles.addCell, photos.length === 0 && styles.photoCellMain]}
            onPress={handleAdd}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                <Text style={styles.addText}>Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>
        {photos.length}/{maxPhotos} fotos · Toca para adicionar, segura para remover
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCellMain: {
    width: '48%',
    aspectRatio: 4 / 3,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  addCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  addText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
});
