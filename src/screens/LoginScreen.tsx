import { router } from 'expo-router';
import { LogIn, UserPlus, Eye, EyeOff, Phone, Zap } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, TextInput, ActivityIndicator } from 'react-native';
import { useAtom } from 'jotai';
import { signInAtom, signUpAtom, authLoadingAtom, authErrorAtom } from '../atoms/authAtoms';

export default function LoginScreen() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [, signIn] = useAtom(signInAtom);
  const [, signUp] = useAtom(signUpAtom);
  const [isLoading] = useAtom(authLoadingAtom);
  const [error] = useAtom(authErrorAtom);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Basic phone validation - at least 10 digits
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  };

  const isValid = useCallback(() => {
    if (isSignUp) {
      return (
        isValidEmail(emailOrUsername) &&
        username.length >= 3 &&
        password.length >= 8 &&
        (phone === '' || isValidPhone(phone)) // Phone is optional but must be valid if provided
      );
    } else {
      return emailOrUsername.length >= 3 && password.length >= 8;
    }
  }, [emailOrUsername, password, username, phone, isSignUp]);

  const handleAuth = async () => {
    if (!isValid()) return;

    try {
      if (isSignUp) {
        await signUp({
          email: emailOrUsername,
          password,
          username,
          phone: phone || undefined
        });
        // After successful signup, switch to sign in mode
        setIsSignUp(false);
        setPassword('');
        setPhone('');
      } else {
        await signIn({ emailOrUsername, password });
        router.replace('/home');
      }
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmailOrUsername('');
    setPassword('');
    setUsername('');
    setPhone('');
  };

  const handleTitlePress = () => {
    // Only navigate to dev screen in development mode
    router.push('/dev');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={handleTitlePress}
            disabled={!__DEV__}
          >
            <Text style={styles.logo}>
              Storylines
            </Text>
          </TouchableOpacity>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {username.length > 0 && username.length < 3 && (
                  <Text style={styles.validationError}>
                    Username must be at least 3 characters
                  </Text>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {emailOrUsername.length > 0 && (
                isSignUp ? (
                  !isValidEmail(emailOrUsername) && (
                    <Text style={styles.validationError}>
                      Please enter a valid email address
                    </Text>
                  )
                ) : (
                  emailOrUsername.length < 3 && (
                    <Text style={styles.validationError}>
                      Must be at least 3 characters
                    </Text>
                  )
                )
              )}
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <View style={styles.phoneContainer}>
                  <Phone size={20} color="#666" style={styles.phoneIcon} />
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
                {phone.length > 0 && !isValidPhone(phone) && (
                  <Text style={styles.validationError}>
                    Please enter a valid phone number
                  </Text>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              {password.length > 0 && password.length < 8 && (
                <Text style={styles.validationError}>
                  Password must be at least 8 characters
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.authButton, (!isValid() || isLoading) && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={!isValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small\" color="#fff" />
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus size={20} color="#fff" />
                  ) : (
                    <LogIn size={20} color="#fff" />
                  )}
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Sign Up' : 'Login'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMode}
              disabled={isLoading}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.builtWithContainer}>
          <Text style={styles.builtWithText}>Built with Bolt</Text>
          <Zap size={16} color="#FFD700" />
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
  devIndicator: {
    fontSize: 16,
    color: '#4CAF50',
  },
  form: {
    backgroundColor: 'rgba(26, 26, 26, 0.45)',
    borderRadius: 12,
    padding: 20,
    gap: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingLeft: 12,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 12,
  },
  validationError: {
    color: '#ff4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  authButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  authButtonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  toggleButton: {
    alignItems: 'center',
    padding: 8,
  },
  toggleText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  builtWithContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  builtWithText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontStyle: 'italic',
  },
});