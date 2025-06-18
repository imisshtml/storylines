import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface DiceRollProps {
  rollResult: number; // 1-20 for D20, 1-6 for D6, etc.
  size?: number;
  onRollComplete?: () => void;
  isRolling?: boolean; // Controls when to show result vs keep rolling
  difficulty?: number; // Difficulty class for the roll
}

export default function DiceRoll({ rollResult, size = 120, onRollComplete, isRolling = false, difficulty = 10 }: DiceRollProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Reset state when rollResult changes (new roll)
    setShowResult(false);
    setIsPlaying(false);
    
    if (videoRef.current) {
      // Simple approach: just play the video from start for 2 seconds
      playRollingAnimation();
    }
  }, [rollResult]);

  const playRollingAnimation = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsPlaying(true);
      
      // Simple rolling: cycle through a few dice faces quickly
      const rollingFaces = [20, 15, 8, 3, 12, 18, 6, 14];
      let currentIndex = 0;
      
      const rollInterval = setInterval(async () => {
        if (!videoRef.current) {
          clearInterval(rollInterval);
          return;
        }
        
        const face = rollingFaces[currentIndex % rollingFaces.length];
        const timeMap: Record<number, number> = {
          20: 500, 19: 1500, 18: 2500, 17: 3500, 16: 4500, 15: 5500,
          14: 6500, 13: 7500, 12: 8500, 11: 9500, 10: 10500, 9: 11500,
          8: 12500, 7: 13500, 6: 14500, 5: 15500, 4: 16500, 3: 17500,
          2: 18500, 1: 19500
        };
        
        await videoRef.current.setPositionAsync(timeMap[face] || 500);
        currentIndex++;
      }, 200); // Change face every 200ms
      
      // Show final result after 2 seconds
      setTimeout(() => {
        clearInterval(rollInterval);
        showFinalResult();
      }, 2000);
      
    } catch (error) {
      console.error('Error starting roll animation:', error);
      setIsPlaying(false);
    }
  };



  const showFinalResult = async () => {
    if (!videoRef.current || showResult) return;
    
    setShowResult(true);
    setIsPlaying(false);
    
    try {
      // Map roll result to specific time ranges
      const timeMap: Record<number, number> = {
        20: 500, 19: 1500, 18: 2500, 17: 3500, 16: 4500, 15: 5500,
        14: 6500, 13: 7500, 12: 8500, 11: 9500, 10: 10500, 9: 11500,
        8: 12500, 7: 13500, 6: 14500, 5: 15500, 4: 16500, 3: 17500,
        2: 18500, 1: 19500
      };
      
      const resultTime = timeMap[rollResult] || 500;
      await videoRef.current.setPositionAsync(resultTime);
      onRollComplete?.();
    } catch (error) {
      console.error('Error showing final result:', error);
    }
  };

  const getDifficultyClass = (roll: number): string => {
    if (roll >= 18) return 'LEGENDARY';
    if (roll >= 15) return 'HARD';
    if (roll >= 10) return 'MEDIUM';
    return 'EASY';
  };

  const getSuccessStatus = (roll: number): string => {
    if (roll >= 15) return 'SUCCESS';
    if (roll >= 10) return 'PARTIAL SUCCESS';
    return 'FAILURE';
  };

  return (
    <View style={styles.container}>
      <View style={styles.diceCard}>
        {showResult && (
          <>
            <Text style={styles.difficultyLabel}>DIFFICULTY CLASS</Text>
            <Text style={styles.difficultyNumber}>{difficulty}</Text>
          </>
        )}
        
        <View style={[styles.videoContainer, { width: size, height: size }]}>
          <Video
            ref={videoRef}
            style={[styles.video, { width: size, height: size }]}
            source={require('../../assets/video/dice2.mp4')}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            volume={0.3}
          />
        </View>
        
        {showResult && (
          <>
            <View style={styles.divider} />
            <Text style={[
              styles.successLabel, 
              rollResult >= 10 ? styles.successText : styles.failureText
            ]}>
              {getSuccessStatus(rollResult)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginVertical: 16,
  },
  diceCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  difficultyLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  difficultyNumber: {
    color: '#FFD700',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  video: {
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: '#8B4513',
    marginVertical: 16,
  },
  successLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
  },
  successText: {
    color: '#4CAF50',
  },
  failureText: {
    color: '#f44336',
  },
}); 