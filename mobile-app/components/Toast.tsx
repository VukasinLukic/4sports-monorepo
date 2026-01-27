import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { successHaptic, errorHaptic, warningHaptic } from '@/utils/haptics';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const toastConfig: Record<ToastType, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bgColor: string }> = {
  success: {
    icon: 'check-circle',
    color: '#4CAF50',
    bgColor: '#1B3D1B',
  },
  error: {
    icon: 'alert-circle',
    color: '#F44336',
    bgColor: '#3D1B1B',
  },
  warning: {
    icon: 'alert',
    color: '#FF9800',
    bgColor: '#3D2E1B',
  },
  info: {
    icon: 'information',
    color: Colors.primary,
    bgColor: Colors.surface,
  },
};

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  action?: ToastConfig['action'];
  onHide: () => void;
}

function Toast({ visible, message, type, action, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: insets.top + Spacing.sm,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.bgColor }]}
        onPress={onHide}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={24}
          color={config.color}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            onPress={() => {
              action.onPress();
              onHide();
            }}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: config.color }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<{
    message: string;
    type: ToastType;
    action?: ToastConfig['action'];
  }>({
    message: '',
    type: 'info',
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    setVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 3000, action }: ToastConfig) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trigger haptic feedback based on type
    switch (type) {
      case 'success':
        successHaptic();
        break;
      case 'error':
        errorHaptic();
        break;
      case 'warning':
        warningHaptic();
        break;
    }

    setToastData({ message, type, action });
    setVisible(true);

    // Auto-hide after duration
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }
  }, [hideToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        message={toastData.message}
        type={toastData.type}
        action={toastData.action}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hooks for specific toast types
export function useSuccessToast() {
  const { showToast } = useToast();
  return useCallback(
    (message: string, action?: ToastConfig['action']) =>
      showToast({ message, type: 'success', action }),
    [showToast]
  );
}

export function useErrorToast() {
  const { showToast } = useToast();
  return useCallback(
    (message: string, action?: ToastConfig['action']) =>
      showToast({ message, type: 'error', action }),
    [showToast]
  );
}

export function useWarningToast() {
  const { showToast } = useToast();
  return useCallback(
    (message: string, action?: ToastConfig['action']) =>
      showToast({ message, type: 'warning', action }),
    [showToast]
  );
}

export function useInfoToast() {
  const { showToast } = useToast();
  return useCallback(
    (message: string, action?: ToastConfig['action']) =>
      showToast({ message, type: 'info', action }),
    [showToast]
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    elevation: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: SCREEN_WIDTH - Spacing.md * 2,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
