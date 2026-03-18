import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
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
  hydrationError,
  onToggleGoalMenu,
  onCloseGoalMenu,
  onDraftChange,
  onCommitGoal,
  onQuickAction,
}: Props) {
  const positiveActions = HYDRATION_QUICK_ACTIONS.filter((action) => action.tone === 'positive');
  const negativeActions = HYDRATION_QUICK_ACTIONS.filter((action) => action.tone === 'negative');
  const goalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '--';
  const progressLabel = hydrationGoal
    ? goalReached
      ? 'Meta batida'
      : `${Math.round(hydrationProgress * 100)}% da meta`
    : 'Sem meta';

  return (
    <View style={s.hydrationCard}>
      <View pointerEvents="none" style={s.hydrationGlow} />

      <View style={s.headerRow}>
        <View style={s.headerCopy}>
          <Text style={s.title}>Hidratação rápida</Text>
          <Text style={s.subtitle}>Inclua ou remova água em toques rápidos, sem sair da home.</Text>
        </View>

        <Pressable style={({ pressed }) => [s.settingsButton, pressed && s.pressed]} onPress={onToggleGoalMenu}>
          <Ionicons name="settings-outline" size={17} color={Brand.hydration} />
        </Pressable>
      </View>

      <View style={s.snapshotRow}>
        <View style={s.snapshotCard}>
          <Text style={s.snapshotLabel}>Atual</Text>
          <Text style={[s.snapshotValue, s.snapshotValueHydration]}>{formatLiters(hydrationMl)}</Text>
        </View>

        <View style={s.snapshotCard}>
          <Text style={s.snapshotLabel}>Meta</Text>
          <Text style={s.snapshotValue}>{goalLabel}</Text>
        </View>

        <View style={s.snapshotCard}>
          <Text style={s.snapshotLabel}>Status</Text>
          <Text style={[s.snapshotValue, goalReached ? s.snapshotValueSuccess : s.snapshotValueHydration]}>
            {progressLabel}
          </Text>
        </View>
      </View>

      <View style={s.statusCard}>
        <Text style={s.statusText}>{hydrationLoading ? 'Carregando hidratação...' : hydrationStatusText}</Text>
      </View>

      <View style={s.group}>
        <Text style={s.groupLabel}>Adicionar água</Text>
        <View style={s.actionsRow}>
          {positiveActions.map((action) => (
            <HomeHydrationButton
              key={action.label}
              label={action.label}
              tone="positive"
              variant="primary"
              onPress={() => onQuickAction(action.deltaMl)}
              disabled={hydrationSaving || hydrationLoading}
            />
          ))}
        </View>
      </View>

      <View style={s.group}>
        <Text style={s.groupLabel}>Remover água</Text>
        <View style={s.actionsRow}>
          {negativeActions.map((action) => (
            <HomeHydrationButton
              key={action.label}
              label={action.label}
              tone="negative"
              variant="primary"
              onPress={() => onQuickAction(action.deltaMl)}
              disabled={hydrationSaving || hydrationLoading}
            />
          ))}
        </View>
      </View>

      <Modal visible={hydrationGoalMenuOpen} transparent animationType="fade" onRequestClose={onCloseGoalMenu}>
        <View style={s.hydrationGoalModalOverlay}>
          <Pressable style={s.hydrationGoalModalBackdrop} onPress={onCloseGoalMenu} />

          <View style={s.hydrationGoalMenu}>
            <View style={s.hydrationGoalMenuHeader}>
              <View style={s.hydrationGoalMenuCopy}>
                <Text style={s.hydrationGoalMenuTitle}>Meta diária de água</Text>
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

      {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
    </View>
  );
}
