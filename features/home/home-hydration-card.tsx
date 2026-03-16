import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Pressable, Text, View } from 'react-native';

import { HomeHydrationButton } from '@/features/home/home-hydration-button';
import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-hydration-card.styles';
import { Brand } from '@/constants/theme';
import {
  formatLiters,
  HYDRATION_QUICK_ACTIONS,
} from '@/features/home/home-utils';
import {
  HYDRATION_GOAL_MAX_ML,
  HYDRATION_GOAL_MIN_ML,
} from '@/utils/hydration';

type Props = {
  hydrationLoading: boolean;
  hydrationSaving: boolean;
  hydrationMl: number;
  hydrationGoal: number | null;
  hydrationProgress: number;
  goalReached: boolean;
  hydrationStatusText: string;
  hydrationEventText: string;
  hydrationGoalMenuOpen: boolean;
  hydrationGoalDraftMl: number;
  hydrationWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationScale: Animated.AnimatedInterpolation<string | number>;
  hydrationError: string | null;
  onToggleGoalMenu: () => void;
  onDraftChange: (goalMl: number) => void;
  onCommitGoal: (goalMl: number) => void;
  onQuickAction: (deltaMl: number) => void;
};

export function HomeHydrationCard({
  hydrationLoading,
  hydrationSaving,
  hydrationMl,
  hydrationGoal,
  hydrationProgress,
  goalReached,
  hydrationStatusText,
  hydrationEventText,
  hydrationGoalMenuOpen,
  hydrationGoalDraftMl,
  hydrationWidth,
  hydrationScale,
  hydrationError,
  onToggleGoalMenu,
  onDraftChange,
  onCommitGoal,
  onQuickAction,
}: Props) {
  return (
    <View style={s.hydrationCard}>
      <View pointerEvents="none" style={s.hydrationGlowLarge} />
      <View pointerEvents="none" style={s.hydrationGlowSmall} />

      <View style={s.hydrationHeaderRow}>
        <View style={s.hydrationHeaderCopy}>
          <View style={s.hydrationIconWrap}>
            <Ionicons name="water-outline" size={18} color="#0B6B94" />
          </View>
          <View style={s.hydrationHeaderText}>
            <Text style={s.hydrationTitle}>Hidratacao</Text>
            <Text style={s.hydrationHeaderHint}>
              {hydrationGoal ? `Meta ${formatLiters(hydrationGoal)}` : 'Defina a meta na engrenagem'}
            </Text>
          </View>
        </View>

        <Pressable style={({ pressed }) => [s.hydrationSettingsButton, pressed && s.pressed]} onPress={onToggleGoalMenu}>
          <Ionicons name="settings-outline" size={18} color="#0B6B94" />
        </Pressable>
      </View>

      {hydrationLoading ? (
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Carregando agua desta data...</Text>
        </View>
      ) : (
        <>
          <View style={s.hydrationTopRow}>
            <View style={s.hydrationMetricGroup}>
              <Animated.Text style={[s.hydrationHeroValue, { transform: [{ scale: hydrationScale }] }]}>
                {formatLiters(hydrationMl)}
              </Animated.Text>
              <Text style={s.hydrationMetricHint}>
                {hydrationGoal ? `de ${formatLiters(hydrationGoal)}` : 'sem meta definida'}
              </Text>
            </View>

            <View style={[s.hydrationProgressBadge, goalReached && s.hydrationProgressBadgeDone]}>
              <Text style={[s.hydrationProgressValue, goalReached && s.hydrationProgressValueDone]}>
                {Math.round(hydrationProgress * 100)}%
              </Text>
              <Text style={[s.hydrationProgressLabel, goalReached && s.hydrationProgressLabelDone]}>
                progresso
              </Text>
            </View>
          </View>

          <View style={s.hydrationTrackShell}>
            <Animated.View style={[s.hydrationTrackFill, { width: hydrationWidth }]} />
          </View>

          <Text style={s.hydrationStatus}>{hydrationStatusText}</Text>

          <View style={s.hydrationActionsGrid}>
            {HYDRATION_QUICK_ACTIONS.map((action) => (
              <HomeHydrationButton
                key={action.label}
                label={action.label}
                tone={action.tone}
                onPress={() => onQuickAction(action.deltaMl)}
                disabled={hydrationSaving}
              />
            ))}
          </View>

          {hydrationGoalMenuOpen ? (
            <View style={s.hydrationGoalMenu}>
              <Text style={s.hydrationGoalMenuTitle}>Meta diaria</Text>
              <View style={s.hydrationGoalMenuHeader}>
                <View style={s.hydrationGoalMenuCopy}>
                  <Text style={s.hydrationGoalMenuHint}>
                    Arraste para ajustar entre 1L e 10L. A meta salva ao soltar.
                  </Text>
                </View>
                <View style={s.hydrationGoalValueBadge}>
                  <Text style={s.hydrationGoalValue}>{formatLiters(hydrationGoalDraftMl)}</Text>
                  <Text style={s.hydrationGoalValueLabel}>{hydrationSaving ? 'salvando' : 'meta atual'}</Text>
                </View>
              </View>

              <HomeHydrationGoalSlider
                value={hydrationGoalDraftMl}
                disabled={hydrationSaving}
                onChange={onDraftChange}
                onChangeEnd={onCommitGoal}
              />

              <View style={s.hydrationGoalScale}>
                <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MIN_ML)}</Text>
                <Text style={s.hydrationGoalScaleHint}>passos de 100ml</Text>
                <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MAX_ML)}</Text>
              </View>
            </View>
          ) : null}

          <Text style={s.hydrationFootnote}>{hydrationEventText}</Text>
        </>
      )}

      {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
    </View>
  );
}
