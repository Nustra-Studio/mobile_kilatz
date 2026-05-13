import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View, useColorScheme as RNuseColorScheme } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeBg = isDark ? '#0F0A00' : '#FFFFFF';
  const themeText = isDark ? '#FFFFFF' : '#111827';
  const themeSubText = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280';
  const themeBadgeBg = isDark ? 'rgba(254,180,0,0.12)' : 'rgba(254,180,0,0.08)';
  // Animation values
  const logoScale = useSharedValue(0.2);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const boltOpacity = useSharedValue(0);
  const boltScale = useSharedValue(0.5);
  const screenOpacity = useSharedValue(1);
  const shimmerX = useSharedValue(-300);
  const taglineOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);
  const bgScale = useSharedValue(1.05);

  useEffect(() => {
    // Phase 1: Logo appear (0ms)
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    bgScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Phase 2: Pulse ring (200ms)
    ringOpacity.value = withDelay(200, withSequence(
      withTiming(0.6, { duration: 400 }),
      withTiming(0, { duration: 600 })
    ));
    ringScale.value = withDelay(200, withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.cubic) }));

    // Phase 3: Bolt strike (400ms)
    boltOpacity.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 200 }));
    boltScale.value = withDelay(400, withSpring(1, { damping: 6, stiffness: 180 }));

    // Phase 4: Text appear (600ms)
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    textTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));

    // Phase 5: Tagline appear (800ms)
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    // Phase 6: Shimmer (900ms)
    shimmerX.value = withDelay(900, withTiming(width + 300, { duration: 900, easing: Easing.inOut(Easing.quad) }));

    // Phase 7: Fade out and finish (2200ms)
    screenOpacity.value = withDelay(2200, withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, []);

  // Animated styles
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const boltStyle = useAnimatedStyle(() => ({
    opacity: boltOpacity.value,
    transform: [{ scale: boltScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: themeBg }, screenStyle]}>
      {/* Background gradient layers */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgStyle]}>
        <View style={[styles.bgTop, { backgroundColor: isDark ? '#1A1000' : '#F3F4F6' }]} />
        <View style={[styles.bgBottom, { backgroundColor: isDark ? '#080500' : '#FFFFFF' }]} />
      </Animated.View>

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTopRight, { opacity: isDark ? 0.06 : 0.1 }]} />
      <View style={[styles.circle, styles.circleBottomLeft, { opacity: isDark ? 0.05 : 0.08 }]} />
      <View style={[styles.circle, styles.circleCenter, { opacity: isDark ? 0.04 : 0.06 }]} />

      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }, shimmerStyle]} />

      {/* Main content */}
      <View style={styles.content}>

        {/* Pulse ring behind logo */}
        <Animated.View style={[styles.ring, ringStyle]} />

        {/* Logo SVG */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <View style={styles.logoContainer}>
            <Svg viewBox="0 0 360 360" width={160} height={160}>
              <Defs>
                <LinearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FEC400" stopOpacity="1" />
                  <Stop offset="1" stopColor="#F08000" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FFF" stopOpacity="0.25" />
                  <Stop offset="1" stopColor="#FFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {/* Bag shadow */}
              <Path
                d="M 80,145 C 80,145 95,280 95,295 C 95,310 120,325 160,325 C 200,325 225,310 225,295 C 225,280 240,145 240,145 Z"
                fill="rgba(0,0,0,0.15)"
                transform="translate(4, 6)"
              />

              {/* Bag handle */}
              <Path
                d="M 110,140 C 130,60 190,60 210,140"
                fill="none"
                stroke="#FEC400"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Bag body */}
              <Path
                d="M 60,140 L 260,140 L 225,295 C 220,315 200,325 160,325 C 120,325 100,315 95,295 Z"
                fill="url(#bagGrad)"
              />

              {/* Bag shine */}
              <Path
                d="M 75,155 L 245,155 L 235,210 L 70,210 Z"
                fill="url(#glowGrad)"
              />

              {/* Bolt */}
              <Path
                d="M 175,130 L 130,210 L 162,210 L 130,295 L 210,190 L 170,190 Z"
                fill="#FFFFFF"
              />
            </Svg>

            {/* Glow ring */}
            <View style={styles.logoGlow} />
          </View>
        </Animated.View>

        {/* Bolt spark effect */}
        <Animated.View style={[styles.sparkContainer, boltStyle]}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <View
              key={i}
              style={[
                styles.spark,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -78 },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Brand name */}
        <Animated.Text style={[styles.brandName, { color: themeText, textShadowColor: isDark ? BRAND : 'transparent' }, textStyle]}>
          KILATZ
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { color: themeSubText }, taglineStyle]}>
          Sistem Kasir Profesional
        </Animated.Text>

        {/* Dots loader */}
        <Animated.View style={[styles.dotsRow, taglineStyle]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.25 }]} />
          ))}
        </Animated.View>
      </View>

      {/* Bottom badge */}
      <Animated.View style={[styles.bottomBadge, taglineStyle]}>
        <View style={[styles.badgePill, { backgroundColor: themeBadgeBg, borderColor: isDark ? 'rgba(254,180,0,0.2)' : '#E5E7EB' }]}>
          <View style={styles.badgeDot} />
          <Animated.Text style={[styles.badgeText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#4B5563' }]}>v1.2.0 • Nustra Group</Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const BRAND = '#FEB400';
const DARK_BG = '#0F0A00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: '#1A1000',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#080500',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: BRAND,
  },
  circleTopRight: {
    width: 300,
    height: 300,
    top: -120,
    right: -100,
    opacity: 0.06,
  },
  circleBottomLeft: {
    width: 250,
    height: 250,
    bottom: -80,
    left: -80,
    opacity: 0.05,
  },
  circleCenter: {
    width: 400,
    height: 400,
    top: height / 2 - 200,
    left: width / 2 - 200,
    opacity: 0.04,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ skewX: '-15deg' }],
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: BRAND,
  },
  logoWrapper: {
    marginBottom: 8,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    backgroundColor: 'rgba(254,180,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(254,180,0,0.2)',
    overflow: 'hidden',
  },
  logoGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 40,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  sparkContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    width: 3,
    height: 12,
    backgroundColor: BRAND,
    borderRadius: 2,
    opacity: 0.7,
  },
  brandName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 12,
    marginTop: 24,
    textShadowColor: BRAND,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3,
    marginTop: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND,
  },
  bottomBadge: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254,180,0,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254,180,0,0.2)',
    gap: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
