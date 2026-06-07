import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients } from '../lib/theme';
import { useAlertStore, AlertButton } from '../store/alert';

// Custom Alert component
export function CustomAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 16, bounciness: 3, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    if (btn.onPress) {
      setTimeout(() => btn.onPress?.(), 100); // small delay to allow modal close animation
    }
  };

  const isRow = buttons.length === 2;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Header */}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          
          {/* Message */}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Button Row / Column */}
          <View style={[styles.buttonContainer, isRow ? styles.row : styles.column]}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              let buttonContent = (
                <Text style={[
                  styles.buttonText,
                  isCancel && styles.cancelButtonText,
                  isDestructive && styles.destructiveButtonText,
                ]}>
                  {btn.text}
                </Text>
              );

              if (isCancel) {
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.button, styles.cancelButton, isRow && styles.flexButton]}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.8}
                  >
                    {buttonContent}
                  </TouchableOpacity>
                );
              }

              if (isDestructive) {
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.button, styles.destructiveButton, isRow && styles.flexButton]}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.8}
                  >
                    {buttonContent}
                  </TouchableOpacity>
                );
              }

              // Default: Primary Pink Gradient Button
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.button, isRow && styles.flexButton]}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {buttonContent}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Mimics React Native's Alert API
export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    useAlertStore.getState().showAlert(title, message, buttons);
  },
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1a1f38', // Colors.darkSurface
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', // Colors.darkBorder
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  column: {
    flexDirection: 'column',
  },
  flexButton: {
    flex: 1,
  },
  button: {
    height: 46,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 15,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: Colors.mutedText,
  },
  destructiveButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  destructiveButtonText: {
    color: Colors.error,
  },
});
