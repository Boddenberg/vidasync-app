import { useEffect, useRef, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent } from 'react-native';

import { s } from '@/features/home/home-hydration-card.styles';
import { clamp } from '@/features/home/home-utils';
import {
  hydrationGoalFromRatio,
  hydrationGoalRatio,
} from '@/utils/hydration';

type Props = {
  value: number;
  disabled?: boolean;
  onChange: (goalMl: number) => void;
  onChangeEnd: (goalMl: number) => void;
};

export function HomeHydrationGoalSlider({ value, disabled, onChange, onChangeEnd }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const valueRef = useRef(value);
  const trackWidthRef = useRef(trackWidth);
  const disabledRef = useRef(Boolean(disabled));
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);

  useEffect(() => {
    valueRef.current = value;
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

  function ratioFromMove(locationX: number) {
    if (trackWidthRef.current <= 0) return hydrationGoalRatio(valueRef.current);
    return clamp(locationX / trackWidthRef.current, 0, 1);
  }

  function updateFromMove(locationX: number, commit: boolean) {
    const nextGoal = hydrationGoalFromRatio(ratioFromMove(locationX));
    onChangeRef.current(nextGoal);
    if (commit) {
      onChangeEndRef.current(nextGoal);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (event) => {
        updateFromMove(event.nativeEvent.locationX, false);
      },
      onPanResponderMove: (event) => {
        updateFromMove(event.nativeEvent.locationX, false);
      },
      onPanResponderRelease: (event) => {
        updateFromMove(event.nativeEvent.locationX, true);
      },
      onPanResponderTerminate: (event) => {
        updateFromMove(event.nativeEvent.locationX, true);
      },
    }),
  ).current;

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={s.sliderWrap}>
      <View
        style={[s.sliderTrack, disabled && s.disabled]}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}>
        <View style={[s.sliderFill, { width: `${ratio * 100}%` }]} />
        <View
          style={[
            s.sliderThumb,
            {
              left: trackWidth > 0 ? clamp(ratio * trackWidth - 14, 0, Math.max(trackWidth - 28, 0)) : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}
