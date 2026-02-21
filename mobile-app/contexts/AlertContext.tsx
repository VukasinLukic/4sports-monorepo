import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CustomAlertDialog } from '@/components/CustomAlertDialog';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'success' | 'error';
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showSuccessAlert: (title: string, message: string, onDismiss?: () => void) => void;
  showErrorAlert: (title: string, message: string, onDismiss?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    buttons: [],
    type: 'default',
  });

  const showAlert = (alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  };

  const showSuccessAlert = (title: string, message: string, onDismiss?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [
        {
          text: 'U redu',
          style: 'default',
          onPress: onDismiss,
        },
      ],
    });
  };

  const showErrorAlert = (title: string, message: string, onDismiss?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [
        {
          text: 'U redu',
          style: 'cancel',
          onPress: onDismiss,
        },
      ],
    });
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showSuccessAlert, showErrorAlert }}>
      {children}
      <CustomAlertDialog
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        type={config.type}
        onDismiss={handleDismiss}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
