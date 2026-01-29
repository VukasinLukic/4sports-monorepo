import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Vibration, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useCameraPermissions } from '@/hooks/useCameraPermissions';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';
import { Member } from '@/types';

interface QRData {
  type: string;
  eventId: string;
  clubId?: string;
}

export default function MemberScanScreen() {
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionLoading, requestPermission } = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const scanCooldownRef = useRef<boolean>(false);

  const fetchMemberProfile = useCallback(async () => {
    try {
      const response = await api.get('/members/me');
      setMember(response.data.data);
    } catch (error) {
      console.error('Error fetching member profile:', error);
    }
  }, []);

  useEffect(() => {
    if (hasPermission === false) {
      requestPermission();
    }
    fetchMemberProfile();
  }, [hasPermission, fetchMemberProfile]);

  useFocusEffect(
    useCallback(() => {
      // Reset scanner when screen comes into focus
      setScanned(false);
      scanCooldownRef.current = false;
    }, [])
  );

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanCooldownRef.current || isProcessing || scanned) {
      return;
    }

    try {
      const qrData: QRData = JSON.parse(result.data);

      if (qrData.type !== 'EVENT_ATTENDANCE') {
        Alert.alert('Invalid QR Code', 'This QR code is not for attendance check-in.');
        return;
      }

      if (!member) {
        Alert.alert('Error', 'Member profile not loaded. Please try again.');
        return;
      }

      scanCooldownRef.current = true;
      setScanned(true);
      Vibration.vibrate(100);

      await processCheckIn(qrData.eventId);

    } catch (error) {
      console.error('QR parse error:', error);
      Alert.alert('Invalid QR Code', 'Could not read this QR code. Please try again.');
      resetScanner();
    }
  };

  const processCheckIn = async (eventId: string) => {
    setIsProcessing(true);

    try {
      const response = await api.post('/attendance/check-in', {
        eventId,
        memberId: member?._id,
      });

      const { event } = response.data.data || {};

      Alert.alert(
        'Check-In Successful!',
        `You have been marked present${event?.title ? ` for "${event.title}"` : ''}.`,
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
          {
            text: 'Scan Again',
            onPress: resetScanner,
          },
        ]
      );
    } catch (error: any) {
      console.error('Check-in error:', error);

      const errorMessage = error.response?.data?.message || 'Failed to check in. Please try again.';

      Alert.alert('Check-In Failed', errorMessage, [
        {
          text: 'Try Again',
          onPress: resetScanner,
        },
        {
          text: 'Cancel',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1000);
  };

  // Loading state for permissions
  if (permissionLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  // No permission state
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.noPermissionTitle}>Camera Access Required</Text>
        <Text style={styles.noPermissionText}>
          To scan QR codes for attendance check-in, please allow camera access.
        </Text>
        <Button
          mode="contained"
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          Allow Camera Access
        </Button>
      </View>
    );
  }

  // No member profile state
  if (!member) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Section */}
          <View style={styles.overlayTop}>
            <Text style={styles.instructionText}>
              Scan the event QR code to check in
            </Text>
            <View style={styles.memberBadge}>
              <MaterialCommunityIcons name="account" size={16} color={Colors.text} />
              <Text style={styles.memberBadgeText}>{member.fullName}</Text>
            </View>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerFrameContainer}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.overlayBottom}>
            {/* Processing Indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.processingText}>Checking in...</Text>
              </View>
            )}

            {/* Info Card */}
            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={Colors.info} />
                <Text style={styles.infoText}>
                  Point your camera at the QR code displayed by your coach
                </Text>
              </Card.Content>
            </Card>

            {/* Cancel Button */}
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.cancelScanButton}
              buttonColor={Colors.surface}
              textColor={Colors.text}
            >
              Cancel
            </Button>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  noPermissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  noPermissionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  permissionButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  instructionText: {
    fontSize: FontSize.md,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  memberBadgeText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  scannerFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BorderRadius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BorderRadius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BorderRadius.md,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  processingText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cancelScanButton: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});
