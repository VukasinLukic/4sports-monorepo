import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text, IconButton, RadioButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '@/services/LanguageContext';

interface LanguagePickerProps {
  variant?: 'modal' | 'inline';
}

export default function LanguagePicker({ variant = 'modal' }: LanguagePickerProps) {
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    await setLanguage(newLanguage);
    setIsVisible(false);
  };

  const currentLanguage = supportedLanguages[language];

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        {Object.entries(supportedLanguages).map(([code, langInfo]) => (
          <TouchableOpacity
            key={code}
            style={[
              styles.inlineOption,
              language === code && styles.inlineOptionSelected,
            ]}
            onPress={() => handleLanguageChange(code as LanguageCode)}
          >
            <Text style={styles.flag}>{langInfo.flag}</Text>
            <Text
              style={[
                styles.inlineOptionText,
                language === code && styles.inlineOptionTextSelected,
              ]}
            >
              {langInfo.nativeName}
            </Text>
            {language === code && (
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        <View style={styles.selectorInfo}>
          <Text style={styles.selectorLabel}>{t('profile.languageSettings')}</Text>
          <Text style={styles.selectorValue}>{currentLanguage.nativeName}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('profile.selectLanguage')}</Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={Colors.textSecondary}
                onPress={() => setIsVisible(false)}
              />
            </View>

            <Divider />

            <View style={styles.optionsList}>
              {Object.entries(supportedLanguages).map(([code, langInfo]) => (
                <TouchableOpacity
                  key={code}
                  style={styles.option}
                  onPress={() => handleLanguageChange(code as LanguageCode)}
                >
                  <Text style={styles.flag}>{langInfo.flag}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{langInfo.nativeName}</Text>
                    <Text style={styles.optionNameEnglish}>{langInfo.name}</Text>
                  </View>
                  <RadioButton.Android
                    value={code}
                    status={language === code ? 'checked' : 'unchecked'}
                    onPress={() => handleLanguageChange(code as LanguageCode)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Compact selector for use in settings menus
export function LanguageSelector() {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  const currentLanguage = supportedLanguages[language];

  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    await setLanguage(newLanguage);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.compactSelector}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        <Text style={styles.compactText}>{currentLanguage.nativeName}</Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            {Object.entries(supportedLanguages).map(([code, langInfo]) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.dropdownOption,
                  language === code && styles.dropdownOptionSelected,
                ]}
                onPress={() => handleLanguageChange(code as LanguageCode)}
              >
                <Text style={styles.flag}>{langInfo.flag}</Text>
                <Text style={styles.dropdownText}>{langInfo.nativeName}</Text>
                {language === code && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={Colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  selectorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  selectorLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  selectorValue: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 2,
  },
  flag: {
    fontSize: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  optionsList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  optionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  optionName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  optionNameEnglish: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Compact selector styles
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  compactText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '40%',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  inlineOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  inlineOptionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  inlineOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
