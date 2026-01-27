import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';

export default function AddMemberScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <MaterialCommunityIcons name="information" size={48} color={Colors.info} />
          <Text style={styles.infoTitle}>Adding Members</Text>
          <Text style={styles.infoText}>
            Members are added when a parent registers their child using your club's invite code.
          </Text>
        </Card.Content>
      </Card>

      {/* Steps */}
      <Text style={styles.sectionTitle}>How it works</Text>

      <Card style={styles.stepCard}>
        <Card.Content style={styles.stepContent}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Generate Invite Code</Text>
            <Text style={styles.stepDescription}>
              Go to your club settings or profile to generate a unique invite code for parents.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.stepCard}>
        <Card.Content style={styles.stepContent}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Share with Parents</Text>
            <Text style={styles.stepDescription}>
              Share the invite code with parents via message, email, or in person.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.stepCard}>
        <Card.Content style={styles.stepContent}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Parent Registers</Text>
            <Text style={styles.stepDescription}>
              Parents download the app, enter the invite code, and register their child's information.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.stepCard}>
        <Card.Content style={styles.stepContent}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Member Appears</Text>
            <Text style={styles.stepDescription}>
              The new member will automatically appear in your members list!
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Button
        mode="contained"
        icon="account-group"
        onPress={() => router.push('/(coach)/members')}
        style={styles.actionButton}
        buttonColor={Colors.primary}
      >
        View Members
      </Button>

      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        Close
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    backgroundColor: Colors.info + '10',
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  infoTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: Spacing.lg,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
});
