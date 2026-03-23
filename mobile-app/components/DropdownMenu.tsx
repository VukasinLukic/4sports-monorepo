import { View, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, FlatList } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';

export interface DropdownItem {
  key: string;
  title: string;
  icon?: string;
  selected?: boolean;
  titleColor?: string;
  divider?: boolean;
}

interface DropdownMenuProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (key: string) => void;
  items: DropdownItem[];
  anchor: React.ReactNode;
}

export default function DropdownMenu({ visible, onDismiss, onSelect, items, anchor }: DropdownMenuProps) {
  return (
    <View>
      {anchor}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                {items.map((item, index) => (
                  <View key={item.key}>
                    {item.divider && index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        onSelect(item.key);
                        onDismiss();
                      }}
                    >
                      {item.icon && (
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={item.titleColor || Colors.text}
                          style={styles.icon}
                        />
                      )}
                      <Text style={[
                        styles.menuItemText,
                        item.titleColor ? { color: item.titleColor } : null,
                      ]}>
                        {item.title}
                      </Text>
                      {item.selected && (
                        <MaterialCommunityIcons name="check" size={20} color={Colors.primary} style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 220,
    maxWidth: 300,
    maxHeight: '70%',
    paddingVertical: Spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  menuItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
});
