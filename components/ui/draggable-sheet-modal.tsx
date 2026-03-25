import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { Brand, Radii, Shadows } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  handleStyle?: StyleProp<ViewStyle>;
  animationType?: ModalProps['animationType'];
  closeThreshold?: number;
};

export function DraggableSheetModal({
  visible,
  onClose,
  children,
  overlayStyle,
  sheetStyle,
  handleStyle,
  animationType = 'slide',
  closeThreshold = 108,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    translateY.stopAnimation();
    translateY.setValue(0);
    closingRef.current = false;
  }, [translateY, visible]);

  function requestClose() {
    if (closingRef.current) return;

    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: Math.max(windowHeight * 0.22, closeThreshold * 1.8),
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      translateY.setValue(0);
      closingRef.current = false;
      if (finished) {
        onClose();
      }
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15,
      onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15,
      onPanResponderMove: (_event, gestureState) => {
        translateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_event, gestureState) => {
        const shouldClose = gestureState.dy >= closeThreshold || gestureState.vy >= 0.9;
        if (shouldClose) {
          requestClose();
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          overshootClamping: true,
          speed: 28,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          overshootClamping: true,
          speed: 28,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={requestClose}>
      <Pressable style={[s.overlay, overlayStyle]} onPress={requestClose}>
        <Animated.View style={[s.sheet, sheetStyle, { transform: [{ translateY }] }]}>
          <Pressable style={s.sheetInner} onPress={(event) => event.stopPropagation()}>
            <View style={s.dragRegion} {...panResponder.panHandlers}>
              <View style={[s.handle, handleStyle]} />
            </View>
            <View style={s.content}>{children}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 35, 26, 0.3)',
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  sheetInner: {
    minHeight: 1,
  },
  dragRegion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
  },
  content: {
    minHeight: 1,
  },
});
