import { View, StyleSheet, Share, Platform } from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useState } from 'react';

export default function EventQRCodeScreen() {
  const { eventId, eventTitle, qrCode } = useLocalSearchParams<{
    eventId: string;
    eventTitle: string;
    qrCode: string;
  }>();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check-in QR Code for ${eventTitle}\n\nCode: ${qrCode}`,
        title: `Event QR Code: ${eventTitle}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{eventTitle}</Text>
          <Text style={styles.subtitle}>Scan to check in</Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrCode}
              size={250}
              backgroundColor={Colors.surface}
              color={Colors.text}
            />
          </View>

          {/* QR Code String */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Check-in Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText} selectable numberOfLines={1}>
                {qrCode}
              </Text>
              <IconButton
                icon={copied ? 'check' : 'content-copy'}
                size={20}
                onPress={handleCopyCode}
                iconColor={copied ? Colors.success : Colors.primary}
              />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <MaterialCommunityIcons name="information" size={20} color={Colors.textSecondary} />
            <Text style={styles.instructions}>
              Members can scan this QR code with their app to check in to the event. The check-in window opens 30 minutes before the event starts.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleShare}
          icon="share-variant"
          style={styles.shareButton}
        >
          Share QR Code
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.closeButton}
          textColor={Colors.textSecondary}
        >
          Close
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  qrContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeContainer: {
    width: '100%',
    marginTop: Spacing.md,
  },
  codeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  codeText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: '80%',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  instructions: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  closeButton: {
    borderColor: Colors.border,
  },
});
