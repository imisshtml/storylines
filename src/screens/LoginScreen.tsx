import { router } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, TextInput } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isValid = useCallback(() => {
    return username.length >= 3 && password.length >= 8;
  }, [username, password]);

  const handleLogin = () => {
    if (isValid()) {
      router.push('/home');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.logo}>Storylines</Text>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username or email"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {username.length > 0 && username.length < 3 && (
                <Text style={styles.errorText}>
                  Username must be at least 3 characters
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {password.length > 0 && password.length < 8 && (
                <Text style={styles.errorText}>
                  Password must be at least 8 characters
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, !isValid() && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!isValid()}
            >
              <LogIn size={20} color="#fff" />
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  form: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    padding: 20,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});