// Inspiration: https://dribbble.com/shots/24989789-Mustard-Golf-Swing-Analysis-App

import { memo, useMemo } from "react";
import { TextProps, View, StyleSheet, TextStyle } from "react-native";
import Animated, {
  FadeOut,
  runOnJS,
  SlideInDown,
} from "react-native-reanimated";

type AnimatedSentenceProps = TextProps & {
  onExitFinish?: () => void;
  onEnterFinish?: (wordsCount: number) => void;
  stagger?: number;
};

export const AnimatedText = memo(
  ({
    children,
    onExitFinish,
    onEnterFinish,
    stagger = 100,
    ...rest
  }: AnimatedSentenceProps) => {
    if (typeof children !== "string") {
      throw new Error("AnimatedSentence only accepts string");
    }

    const words = useMemo(() => children.split(" "), [children]);

    const fontSize = useMemo(() => {
      try {
        const flattened = StyleSheet.flatten(rest.style as any) as TextStyle | undefined;
        return flattened?.fontSize ?? 16;
      } catch {
        return 16;
      }
    }, [rest.style]);

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        {words.map((word, index) => (
          <View style={{ overflow: "hidden" }} key={`word-${index}`}>
            <Animated.Text
              entering={SlideInDown.springify()
                .damping(80)
                .stiffness(200)
                .delay(index * stagger)
                .withInitialValues({
                  originY: (fontSize + 10) * 2,
                })
                .withCallback((finished) => {
                  if (
                    finished &&
                    index === words.length - 1 &&
                    onEnterFinish &&
                    children !== ""
                  ) {
                    runOnJS(onEnterFinish)(words.length);
                  }
                })}
              exiting={FadeOut.springify()
                .damping(80)
                .stiffness(200)
                .withCallback((finished) => {
                  if (
                    finished &&
                    index === words.length - 1 &&
                    onExitFinish &&
                    children !== ""
                  ) {
                    runOnJS(onExitFinish)();
                  }
                })}
              {...rest}
            >
              {word}
            </Animated.Text>
          </View>
        ))}
      </View>
    );
  }
);

AnimatedText.displayName = 'AnimatedText';
