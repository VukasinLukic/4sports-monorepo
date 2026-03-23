import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';

export default function EventQRCodeScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle, qrCode } = useLocalSearchParams<{
    eventId: string;
    eventTitle: string;
    qrCode: string;
  }>();

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{eventTitle}</Text>
          <Text style={styles.subtitle}>{t('qr.scanToCheckInSubtitle')}</Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrCode}
              size={220}
              backgroundColor={Colors.surface}
              color={Colors.text}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <MaterialCommunityIcons name="information" size={20} color={Colors.textSecondary} />
            <Text style={styles.instructions}>
              {t('qr.scanOnEventDay')}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => {
            router.replace({
              pathname: '/(coach)/events/[id]',
              params: { id: eventId, tab: 'participants' },
            });
          }}
          icon="account-check"
          style={styles.manualButton}
        >
          {t('qr.manualAttendance')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.closeButton}
          textColor={Colors.textSecondary}
        >
          {t('common.close')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
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
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  manualButton: {
    backgroundColor: Colors.primary,
  },
  closeButton: {
    borderColor: Colors.border,
  },
});
