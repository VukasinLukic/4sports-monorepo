import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';

interface QRCodeDisplayProps {
  qrCode: string;
  memberName: string;
  size?: number;
  showName?: boolean;
}

export default function QRCodeDisplay({
  qrCode,
  memberName,
  size = 200,
  showName = true,
}: QRCodeDisplayProps) {
  if (!qrCode) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.errorContent}>
          <Text style={styles.errorText}>QR Code not available</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        {/* QR Code with white background */}
        <View style={[styles.qrWrapper, { width: size + 32, height: size + 32 }]}>
          <QRCode
            value={qrCode}
            size={size}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </View>

        {/* Member Name */}
        {showName && (
          <Text style={styles.memberName} numberOfLines={1}>
            {memberName}
          </Text>
        )}

        {/* Instruction */}
        <Text style={styles.instruction}>
          Show this QR code to mark attendance
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  instruction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
