import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ADMIN_PASSWORD, useUsers, UserRole } from '../store/users';

export default function LoginScreen({ navigation }: any) {
  const { login, registerUser, loginError, clearLoginError } = useUsers();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const title = useMemo(() => (mode === 'login' ? 'Login' : 'Create account'), [mode]);

  const enterApp = () => navigation.replace('Map');

  const submit = () => {
    clearLoginError();
    if (mode === 'login') {
      if (login(email, password)) enterApp();
      return;
    }
    const ok = registerUser({
      name,
      age: Number(age),
      email,
      password,
      role,
      adminPassword,
    });
    if (ok) enterApp();
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
              onPress={() => setMode('login')}
            >
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, mode === 'register' && styles.switchActive]}
              onPress={() => setMode('register')}
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
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'user' && styles.roleActive]}
                  onPress={() => setRole('user')}
                >
                  <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'admin' && styles.roleActive]}
                  onPress={() => setRole('admin')}
                >
                  <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
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
          {mode === 'register' && role === 'admin' && (
            <TextInput
              style={styles.input}
              placeholder="Enter admin password"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
            />
          )}
          {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
          {mode === 'register' && role === 'admin' && (
            <Text style={styles.note}>Demo admin password: {ADMIN_PASSWORD}</Text>
          )}
          <TouchableOpacity style={styles.submit} onPress={submit}>
            <Text style={styles.submitText}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
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
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  roleButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, alignItems: 'center' },
  roleActive: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  roleText: { color: '#555', fontWeight: '700' },
  roleTextActive: { color: '#1b5e20' },
  error: { color: '#c62828', marginBottom: 10, fontWeight: '600' },
  note: { color: '#666', marginBottom: 10, fontSize: 12 },
  submit: { backgroundColor: '#2e7d32', padding: 13, borderRadius: 6, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
