import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { s } from '@/features/home/home-hydration-card.styles';
import { clamp } from '@/features/home/home-utils';
import {
  hydrationGoalFromRatio,
  hydrationGoalRatio,
} from '@/utils/hydration';

const SLIDER_THUMB_SIZE = 30;

type Props = {
  value: number;
  disabled?: boolean;
  onChange: (goalMl: number) => void;
  onChangeEnd: (goalMl: number) => void;
};

export function HomeHydrationGoalSlider({ value, disabled, onChange, onChangeEnd }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const trackRef = useRef<View>(null);
  const valueRef = useRef(value);
  const draftValueRef = useRef(value);
  const trackWidthRef = useRef(trackWidth);
  const trackPageXRef = useRef(0);
  const disabledRef = useRef(Boolean(disabled));
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);

  useEffect(() => {
    valueRef.current = value;
    draftValueRef.current = value;
  }, [value]);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    disabledRef.current = Boolean(disabled);
  }, [disabled]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeEndRef.current = onChangeEnd;
  }, [onChangeEnd]);

  const ratio = hydrationGoalRatio(value);

  function syncTrackPosition() {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;

      if (width > 0 && width !== trackWidthRef.current) {
        trackWidthRef.current = width;
        setTrackWidth(width);
      }
    });
  }

  function ratioFromMove(locationX: number) {
    if (trackWidthRef.current <= 0) return hydrationGoalRatio(valueRef.current);
    return clamp(locationX / trackWidthRef.current, 0, 1);
  }

  function locationFromEvent(event: GestureResponderEvent) {
    if (trackWidthRef.current <= 0) {
      return event.nativeEvent.locationX;
    }

    if (typeof event.nativeEvent.pageX === 'number') {
      return clamp(event.nativeEvent.pageX - trackPageXRef.current, 0, trackWidthRef.current);
    }

    return clamp(event.nativeEvent.locationX, 0, trackWidthRef.current);
  }

  function updateFromMove(locationX: number, commit: boolean) {
    const nextGoal = hydrationGoalFromRatio(ratioFromMove(locationX));

    if (draftValueRef.current !== nextGoal) {
      draftValueRef.current = nextGoal;
      onChangeRef.current(nextGoal);
    }

    if (commit) {
      onChangeEndRef.current(nextGoal);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        !disabledRef.current && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
      onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
        !disabledRef.current && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
      onPanResponderGrant: (event) => {
        syncTrackPosition();
        updateFromMove(locationFromEvent(event), false);
      },
      onPanResponderMove: (event) => {
        updateFromMove(locationFromEvent(event), false);
      },
      onPanResponderRelease: (event) => {
        updateFromMove(locationFromEvent(event), true);
      },
      onPanResponderTerminate: (event) => {
        updateFromMove(locationFromEvent(event), true);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  function handleTrackLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    setTrackWidth(nextWidth);
    trackWidthRef.current = nextWidth;
    requestAnimationFrame(syncTrackPosition);
  }

  return (
    <View style={s.sliderWrap}>
      <View
        ref={trackRef}
        collapsable={false}
        style={[s.sliderTrack, disabled && s.disabled]}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}>
        <View style={[s.sliderFill, { width: `${ratio * 100}%` }]} />
        <View
          style={[
            s.sliderThumb,
            {
              left: trackWidth > 0
                ? clamp(ratio * trackWidth - SLIDER_THUMB_SIZE / 2, 0, Math.max(trackWidth - SLIDER_THUMB_SIZE, 0))
                : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}
