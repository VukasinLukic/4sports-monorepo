import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, Avatar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { Member, PaymentStatus } from '@/types';

interface MemberCardProps {
  member: Member;
  onPress: (member: Member) => void;
}

export default function MemberCard({ member, onPress }: MemberCardProps) {
  const getPaymentStatusInfo = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return { color: Colors.success, label: 'Paid', icon: 'check-circle' as const };
      case PaymentStatus.UNPAID:
        return { color: Colors.error, label: 'Unpaid', icon: 'alert-circle' as const };
      case PaymentStatus.PARTIAL:
        return { color: Colors.warning, label: 'Partial', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const getMedicalStatusInfo = (status: string) => {
    switch (status) {
      case 'VALID':
        return { color: Colors.success, label: 'Valid', icon: 'check-circle' as const };
      case 'EXPIRED':
        return { color: Colors.error, label: 'Expired', icon: 'alert-circle' as const };
      case 'EXPIRING_SOON':
        return { color: Colors.warning, label: 'Expiring', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const paymentInfo = getPaymentStatusInfo(member.paymentStatus);
  const medicalInfo = getMedicalStatusInfo(member.medicalCheckStatus);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  };

  return (
    <TouchableOpacity onPress={() => onPress(member)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Avatar */}
          <Avatar.Text
            size={50}
            label={getInitials(member.fullName)}
            style={styles.avatar}
          />

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {member.fullName}
            </Text>
            <Text style={styles.meta}>
              Age: {member.age} {member.position ? `• ${member.position}` : ''}
            </Text>

            {/* Status Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: paymentInfo.color + '20' }]}>
                <MaterialCommunityIcons
                  name={paymentInfo.icon}
                  size={12}
                  color={paymentInfo.color}
                />
                <Text style={[styles.badgeText, { color: paymentInfo.color }]}>
                  {paymentInfo.label}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: medicalInfo.color + '20' }]}>
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={12}
                  color={medicalInfo.color}
                />
                <Text style={[styles.badgeText, { color: medicalInfo.color }]}>
                  {medicalInfo.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrow */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Colors.textSecondary}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
