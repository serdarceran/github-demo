import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  error?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  error,
  autoCapitalize,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.neutral[500]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {!!error && (
          <Ionicons
            name="alert-circle"
            size={20}
            color={Colors.danger[500]}
            style={styles.errorIcon}
          />
        )}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    ...Typography.body.label,
    color: Colors.neutral[500],
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    height: 56,
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.amber[500],
  },
  inputContainerError: {
    borderColor: Colors.danger[500],
  },
  input: {
    flex: 1,
    ...Typography.body.md,
    color: Colors.neutral.white,
    // Reset default padding that TextInput adds on Android
    paddingVertical: 0,
  },
  errorIcon: {
    marginLeft: Spacing.xs,
  },
  errorText: {
    ...Typography.body.xs,
    color: Colors.danger[500],
    marginTop: Spacing.xs,
  },
});
