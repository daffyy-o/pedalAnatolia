import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/auth';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients } from '../lib/theme';

function GradientButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.55 : 1 }}>
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.gradientButtonText}>{title}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const {
    login,
    registerUser,
    loginError,
    authNotice,
    loading,
    clearLoginError,
    clearAuthNotice,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mount animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create account'), [mode]);

  const submit = async () => {
    clearLoginError();
    clearAuthNotice();
    if (mode === 'login') {
      await login(email, password);
      return;
    }
    const result = await registerUser({ name, age: Number(age), email, password });
    if (result.requiresEmailConfirmation) {
      setMode('login');
      setPassword('');
    }
  };

  const changeMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    clearLoginError();
    clearAuthNotice();
  };

  return (
    <LinearGradient colors={Gradients.dark} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandEmoji}>🚴</Text>
            <Text style={styles.brand}>PEDAL ANATOLIA</Text>
            <View style={styles.brandAccent} />
            <Text style={styles.brandTagline}>Bicycle routing for Turkey</Text>
          </View>

          {/* Auth panel */}
          <Animated.View
            style={[
              styles.panel,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.panelTitle}>{title}</Text>

            {/* Mode toggle */}
            <View style={styles.switchRow}>
              <TouchableOpacity
                style={[styles.switchButton, mode === 'login' && styles.switchActive]}
                onPress={() => changeMode('login')}
              >
                <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchButton, mode === 'register' && styles.switchActive]}
                onPress={() => changeMode('register')}
              >
                <Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'register' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={Colors.mutedText}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your age"
                    placeholderTextColor={Colors.mutedText}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.mutedText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.mutedText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
            {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}

            <GradientButton
              title={mode === 'login' ? 'Login' : 'Create account'}
              onPress={submit}
              disabled={loading}
              loading={loading}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:          { flex: 1 },
  flex:            { flex: 1 },
  content:         { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  // Brand
  brandContainer:  { alignItems: 'center', marginBottom: Spacing.xxxl },
  brandEmoji:      { fontSize: 48, marginBottom: Spacing.sm },
  brand:           { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 3, textAlign: 'center' },
  brandAccent:     { width: 48, height: 3, backgroundColor: Colors.primary, borderRadius: 99, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  brandTagline:    { ...Typography.muted, textAlign: 'center' },

  // Panel
  panel: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  panelTitle:      { ...Typography.h2, marginBottom: Spacing.lg },

  // Toggle
  switchRow:       { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BorderRadius.sm, marginBottom: Spacing.xl, padding: 3 },
  switchButton:    { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm - 2 },
  switchActive:    { backgroundColor: Colors.primary },
  switchText:      { ...Typography.bodyBold, color: Colors.mutedText },
  switchTextActive:{ color: Colors.white, fontWeight: '700' },

  // Inputs
  inputContainer:  { marginBottom: Spacing.md },
  inputLabel:      { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 15,
  },

  // Feedback
  error:           { color: Colors.error, marginBottom: Spacing.md, fontWeight: '600', fontSize: 13 },
  notice:          { color: Colors.success, marginBottom: Spacing.md, fontWeight: '600', fontSize: 13 },

  // Button
  gradientButton:  { borderRadius: BorderRadius.sm, paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.sm },
  gradientButtonText: { color: Colors.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
