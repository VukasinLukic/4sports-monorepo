import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize, BorderRadius } from '@/constants/Layout';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface CustomAlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'success' | 'error';
  onDismiss: () => void;
}

export function CustomAlertDialog({
  visible,
  title,
  message,
  buttons = [],
  type = 'default',
  onDismiss,
}: CustomAlertDialogProps) {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle' as const, color: Colors.success };
      case 'error':
        return { name: 'alert-circle' as const, color: Colors.error };
      default:
        return { name: 'information' as const, color: Colors.primary };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <Dialog.Content style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={iconConfig.name}
              size={40}
              color={iconConfig.color}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}
        </Dialog.Content>

        {/* Buttons */}
        {buttons.length > 0 && (
          <Dialog.Actions style={styles.actions}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = button.style === 'default' || (!isDestructive && !isCancel);

              return (
                <Button
                  key={index}
                  mode={isPrimary ? 'contained' : 'outlined'}
                  onPress={() => handleButtonPress(button)}
                  style={[
                    styles.button,
                    isDestructive && styles.destructiveButton,
                  ]}
                  buttonColor={
                    isPrimary
                      ? Colors.primary
                      : isDestructive
                      ? Colors.error
                      : Colors.surface
                  }
                  textColor={
                    isPrimary
                      ? Colors.text
                      : isDestructive
                      ? '#FFFFFF'
                      : Colors.textSecondary
                  }
                  labelStyle={styles.buttonLabel}
                >
                  {button.text}
                </Button>
              );
            })}
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: 320,
    maxWidth: 320,
    alignSelf: 'center',
  },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  destructiveButton: {
    backgroundColor: Colors.error,
  },
  buttonLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
