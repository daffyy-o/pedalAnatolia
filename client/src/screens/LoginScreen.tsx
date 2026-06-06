import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../store/auth';

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

  const title = useMemo(() => (mode === 'login' ? 'Login' : 'Create account'), [mode]);

  const submit = async () => {
    clearLoginError();
    clearAuthNotice();

    if (mode === 'login') {
      await login(email, password);
      return;
    }

    const result = await registerUser({
      name,
      age: Number(age),
      email,
      password,
    });
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={20}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>Pedal Anatolia</Text>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[styles.switchButton, mode === 'login' && styles.switchActive]}
              onPress={() => changeMode('login')}
            >
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, mode === 'register' && styles.switchActive]}
              onPress={() => changeMode('register')}
            >
              <Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <>
              <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
          {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
          <TouchableOpacity
            style={[styles.submit, loading && styles.submitDisabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef4f8' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 40 },
  brand: { fontSize: 30, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', marginBottom: 18 },
  panel: { backgroundColor: 'white', borderRadius: 8, padding: 18, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 14, color: '#222' },
  switchRow: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 6, marginBottom: 14 },
  switchButton: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  switchActive: { backgroundColor: '#2e7d32' },
  switchText: { color: '#555', fontWeight: '700' },
  switchTextActive: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  error: { color: '#c62828', marginBottom: 10, fontWeight: '600' },
  notice: { color: '#1b5e20', marginBottom: 10, fontWeight: '600' },
  submit: { backgroundColor: '#2e7d32', padding: 13, borderRadius: 6, alignItems: 'center' },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
