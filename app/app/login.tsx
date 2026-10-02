import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    const trimmed = email.trim();
    if (!trimmed) return 'Please enter your email address.';
    if (!trimmed.includes('@')) return 'That does not look like a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'register' && password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') await register(email.trim(), password);
      else await login(email.trim(), password);
      router.replace(returnTo === '/scan/result' ? '/scan/result' : '/(tabs)');
    } catch (cause) {
      setError((cause as Error).message || 'Could not sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back to welcome screen"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'register' ? 'Create Account' : 'Sign In'}</Text>
            <Text style={styles.subtitle}>
              Save your scan history and keep it private to your account.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Email address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Password"
              />
            </View>

            {mode === 'register' && <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="Repeat your password"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Confirm password"
              />
            </View>}

            <TouchableOpacity onPress={() => setShowPassword((visible) => !visible)} accessibilityRole="button">
              <Text style={styles.backText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={mode === 'register' ? 'Create account' : 'Sign in'}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{mode === 'register' ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}>
            <Text style={styles.disclaimer}>
              {mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  backRow: {
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
    padding: SPACING.xs,
  },
  backText: {
    color: COLORS.green,
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
    lineHeight: 22,
  },
  form: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    ...SHADOWS.sm,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    lineHeight: 20,
  },
  submitBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.muted,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disclaimer: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
});
