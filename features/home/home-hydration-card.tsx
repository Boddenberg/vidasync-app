import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

import { HomeHydrationButton } from '@/features/home/home-hydration-button';
import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-hydration-card.styles';
import { formatLiters, HYDRATION_QUICK_ACTIONS } from '@/features/home/home-utils';
import { HYDRATION_GOAL_MAX_ML, HYDRATION_GOAL_MIN_ML } from '@/utils/hydration';

type Props = {
  hydrationLoading: boolean;
  hydrationSaving: boolean;
  hydrationMl: number;
  hydrationGoal: number | null;
  hydrationProgress: number;
  goalReached: boolean;
  hydrationStatusText: string;
  hydrationGoalMenuOpen: boolean;
  hydrationGoalDraftMl: number;
  hydrationWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationScale: Animated.AnimatedInterpolation<string | number>;
  hydrationError: string | null;
  onToggleGoalMenu: () => void;
  onCloseGoalMenu: () => void;
  onDraftChange: (goalMl: number) => void;
  onCommitGoal: (goalMl: number) => void;
  onQuickAction: (deltaMl: number) => void;
};

export function HomeHydrationCard({
  hydrationLoading,
  hydrationSaving,
  hydrationMl,
  hydrationGoal,
  hydrationGoalMenuOpen,
  hydrationGoalDraftMl,
  hydrationWidth,
  hydrationScale,
  hydrationError,
  onToggleGoalMenu,
  onCloseGoalMenu,
  onDraftChange,
  onCommitGoal,
  onQuickAction,
}: Props) {
  const quickActions = HYDRATION_QUICK_ACTIONS.filter((action) => action.tone === 'positive');
  const goalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '--';

  return (
    <View style={s.hydrationCard}>
      <View pointerEvents="none" style={s.hydrationGlow} />

      {hydrationLoading ? (
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Carregando agua...</Text>
        </View>
      ) : (
        <>
          <View style={s.headerRow}>
            <Text style={s.title}>Agua</Text>

            <Pressable style={({ pressed }) => [s.settingsButton, pressed && s.pressed]} onPress={onToggleGoalMenu}>
              <Ionicons name="settings-outline" size={16} color="#2D9CDB" />
            </Pressable>
          </View>

          <View style={s.valueRow}>
            <Animated.Text style={[s.valueCurrent, { transform: [{ scale: hydrationScale }] }]}>
              {formatLiters(hydrationMl)}
            </Animated.Text>
            <Text style={s.valueGoal}> / {goalLabel}</Text>
          </View>

          <View style={s.trackShell}>
            <Animated.View style={[s.trackFill, { width: hydrationWidth }]} />
          </View>

          <View style={s.actionsRow}>
            {quickActions.map((action) => (
              <HomeHydrationButton
                key={action.label}
                label={action.label}
                tone={action.tone}
                variant="secondary"
                onPress={() => onQuickAction(action.deltaMl)}
                disabled={hydrationSaving}
              />
            ))}
          </View>

          <Modal visible={hydrationGoalMenuOpen} transparent animationType="fade" onRequestClose={onCloseGoalMenu}>
            <View style={s.hydrationGoalModalOverlay}>
              <Pressable style={s.hydrationGoalModalBackdrop} onPress={onCloseGoalMenu} />

              <View style={s.hydrationGoalMenu}>
                <View style={s.hydrationGoalMenuHeader}>
                  <View style={s.hydrationGoalMenuCopy}>
                    <Text style={s.hydrationGoalMenuTitle}>Meta diaria</Text>
                    <Text style={s.hydrationGoalMenuHint}>Deslize para ajustar de 1L a 10L.</Text>
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
            </View>
          </Modal>
        </>
      )}

      {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
    </View>
  );
}
