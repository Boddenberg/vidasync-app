import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

import { HomeHydrationButton } from '@/features/home/home-hydration-button';
import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-hydration-card.styles';
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
  hydrationProgress,
  goalReached,
  hydrationStatusText,
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
  const addActions = HYDRATION_QUICK_ACTIONS.filter((action) => action.tone === 'positive');
  const correctionActions = HYDRATION_QUICK_ACTIONS.filter((action) => action.tone === 'negative');

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
            <Text style={s.hydrationTitle}>Hidratação</Text>
            <Text style={s.hydrationHeaderHint}>{hydrationGoal ? `Meta ${formatLiters(hydrationGoal)}` : 'Ajuste a meta na engrenagem'}</Text>
          </View>
        </View>

        <Pressable style={({ pressed }) => [s.hydrationSettingsButton, pressed && s.pressed]} onPress={onToggleGoalMenu}>
          <Ionicons name="settings-outline" size={18} color="#0B6B94" />
        </Pressable>
      </View>

      {hydrationLoading ? (
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Carregando água desta data...</Text>
        </View>
      ) : (
        <>
          <View style={s.hydrationTopRow}>
            <View style={s.hydrationMetricGroup}>
              <Text style={s.hydrationEyebrow}>Total do dia</Text>
              <Animated.Text style={[s.hydrationHeroValue, { transform: [{ scale: hydrationScale }] }]}>
                {formatLiters(hydrationMl)}
              </Animated.Text>
              <Text style={s.hydrationMetricHint}>
                {hydrationGoal ? `de ${formatLiters(hydrationGoal)}` : 'sem meta definida'}
              </Text>
            </View>

            <View style={s.hydrationProgressColumn}>
              <View style={[s.hydrationProgressBadge, goalReached && s.hydrationProgressBadgeDone]}>
                <Text style={[s.hydrationProgressValue, goalReached && s.hydrationProgressValueDone]}>
                  {Math.round(hydrationProgress * 100)}%
                </Text>
                <Text style={[s.hydrationProgressLabel, goalReached && s.hydrationProgressLabelDone]}>
                  progresso
                </Text>
              </View>

              <View style={[s.hydrationSummaryChip, goalReached && s.hydrationSummaryChipDone]}>
                <Ionicons
                  name={goalReached ? 'checkmark-circle' : hydrationGoal ? 'water-outline' : 'settings-outline'}
                  size={14}
                  color={goalReached ? '#166534' : '#0B6B94'}
                />
                <Text style={[s.hydrationSummaryChipText, goalReached && s.hydrationSummaryChipTextDone]}>
                  {goalReached ? 'Meta concluída' : hydrationGoal ? 'Em andamento' : 'Sem meta'}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.hydrationTrackShell}>
            <Animated.View style={[s.hydrationTrackFill, { width: hydrationWidth }]} />
          </View>

          <View style={[s.hydrationStatusCard, goalReached && s.hydrationStatusCardDone]}>
            <Ionicons
              name={goalReached ? 'sparkles-outline' : hydrationGoal ? 'time-outline' : 'information-circle-outline'}
              size={16}
              color={goalReached ? '#166534' : '#0B6B94'}
            />
            <Text style={[s.hydrationStatus, goalReached && s.hydrationStatusDone]}>{hydrationStatusText}</Text>
          </View>

          <View style={s.hydrationActionsSection}>
            <View style={s.hydrationSectionHeader}>
              <Text style={s.hydrationSectionTitle}>Adicionar água</Text>
              <Text style={s.hydrationSectionHint}>registro rápido</Text>
            </View>

            <View style={s.hydrationPrimaryActions}>
              {addActions.map((action) => (
                <HomeHydrationButton
                  key={action.label}
                  label={action.label}
                  tone={action.tone}
                  variant="primary"
                  eyebrow="Adicionar"
                  onPress={() => onQuickAction(action.deltaMl)}
                  disabled={hydrationSaving}
                />
              ))}
            </View>
          </View>

          <View style={s.hydrationActionsSection}>
            <View style={s.hydrationSectionHeader}>
              <Text style={s.hydrationSectionTitle}>Corrigir ajuste</Text>
              <Text style={s.hydrationSectionHint}>usar so se precisar</Text>
            </View>

            <View style={s.hydrationSecondaryActions}>
              {correctionActions.map((action) => (
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
          </View>

          <Modal
            visible={hydrationGoalMenuOpen}
            transparent
            animationType="fade"
            onRequestClose={onCloseGoalMenu}>
            <View style={s.hydrationGoalModalOverlay}>
              <Pressable style={s.hydrationGoalModalBackdrop} onPress={onCloseGoalMenu} />

              <View style={s.hydrationGoalMenu}>
                <View style={s.hydrationGoalMenuHeader}>
                  <View style={s.hydrationGoalMenuCopy}>
                    <Text style={s.hydrationGoalMenuTitle}>Meta diária</Text>
                    <Text style={s.hydrationGoalMenuHint}>
                      Arraste com calma entre 1L e 10L. A meta salva quando você soltar.
                    </Text>
                  </View>
                  <View style={s.hydrationGoalValueBadge}>
                    <Text style={s.hydrationGoalValue}>{formatLiters(hydrationGoalDraftMl)}</Text>
                    <Text style={s.hydrationGoalValueLabel}>
                      {hydrationSaving ? 'salvando' : 'meta atual'}
                    </Text>
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
