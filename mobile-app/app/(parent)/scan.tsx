import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Vibration, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function ParentScanScreen() {
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionLoading, requestPermission } = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [children, setChildren] = useState<Member[]>([]);
  const [selectedChild, setSelectedChild] = useState<Member | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const scanCooldownRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasPermission === false) {
      requestPermission();
    }
    fetchChildren();
  }, [hasPermission]);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/members/my-children');
      const childrenData = response.data.data || [];
      setChildren(childrenData);

      // If only one child, auto-select
      if (childrenData.length === 1) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

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

      scanCooldownRef.current = true;
      setScanned(true);
      Vibration.vibrate(100);

      // If multiple children, show selector
      if (children.length > 1 && !selectedChild) {
        setPendingEventId(qrData.eventId);
        setShowChildSelector(true);
        return;
      }

      // If one child or already selected, proceed with check-in
      await processCheckIn(qrData.eventId, selectedChild || children[0]);

    } catch (error) {
      console.error('QR parse error:', error);
      Alert.alert('Invalid QR Code', 'Could not read this QR code. Please try again.');
      resetScanner();
    }
  };

  const processCheckIn = async (eventId: string, child: Member) => {
    setIsProcessing(true);
    setShowChildSelector(false);

    try {
      const response = await api.post('/attendance/check-in', {
        eventId,
        memberId: child._id,
      });

      const { event } = response.data.data || {};

      Alert.alert(
        'Check-In Successful!',
        `${child.fullName} has been marked present${event?.title ? ` for "${event.title}"` : ''}.`,
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
    setPendingEventId(null);
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1000);
  };

  const selectChildAndCheckIn = (child: Member) => {
    setSelectedChild(child);
    if (pendingEventId) {
      processCheckIn(pendingEventId, child);
    }
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

  // No children state
  if (children.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="account-child-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.noPermissionTitle}>No Children Found</Text>
        <Text style={styles.noPermissionText}>
          You don't have any children registered. Please contact your coach.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.permissionButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  // Child selector modal
  if (showChildSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.selectorContainer}>
          <Card style={styles.selectorCard}>
            <Card.Content>
              <Text style={styles.selectorTitle}>Select Child</Text>
              <Text style={styles.selectorSubtitle}>
                Who is checking in for this event?
              </Text>

              {children.map((child) => (
                <Button
                  key={child._id}
                  mode="outlined"
                  onPress={() => selectChildAndCheckIn(child)}
                  style={styles.childButton}
                  contentStyle={styles.childButtonContent}
                  icon="account"
                >
                  {child.fullName}
                </Button>
              ))}

              <Button
                mode="text"
                onPress={resetScanner}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </Card.Content>
          </Card>
        </View>
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
            {selectedChild && (
              <View style={styles.selectedChildBadge}>
                <MaterialCommunityIcons name="account" size={16} color={Colors.text} />
                <Text style={styles.selectedChildText}>{selectedChild.fullName}</Text>
              </View>
            )}
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

            {/* Child Selector (if multiple children) */}
            {children.length > 1 && (
              <Card style={styles.childSelectorCard}>
                <Card.Content style={styles.childSelectorContent}>
                  <Text style={styles.childSelectorLabel}>Checking in for:</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowChildSelector(true)}
                    compact
                    style={styles.changeChildButton}
                  >
                    {selectedChild?.fullName || 'Select Child'}
                  </Button>
                </Card.Content>
              </Card>
            )}

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
  selectorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  selectorCard: {
    backgroundColor: Colors.surface,
  },
  selectorTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  selectorSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  childButton: {
    marginBottom: Spacing.sm,
    borderColor: Colors.primary,
  },
  childButtonContent: {
    paddingVertical: Spacing.sm,
  },
  cancelButton: {
    marginTop: Spacing.md,
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
  selectedChildBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  selectedChildText: {
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
  childSelectorCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  childSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childSelectorLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  changeChildButton: {
    borderColor: Colors.primary,
  },
  cancelScanButton: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});
