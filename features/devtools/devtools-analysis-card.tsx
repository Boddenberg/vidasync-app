import type { Dispatch, SetStateAction } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PdfPlanAnalyzer } from '@/components/nutrition/pdf-plan-analyzer';
import { PhotoNutritionAnalyzer } from '@/components/nutrition/photo-nutrition-analyzer';
import { AudioNutritionAnalyzer } from '@/components/nutrition/audio-nutrition-analyzer';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { ToolView } from '@/features/devtools/devtools-utils';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import type { PlanPdfAnalysisResult } from '@/types/plan';

type Props = {
  view: ToolView;
  photoAttachments: AttachmentItem[];
  planPdfAttachments: AttachmentItem[];
  onChangePhotoAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onChangePlanPdfAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onSelectView: (view: ToolView) => void;
  onNutritionNeedsReview: (
    source: 'photo' | 'audio',
    result: NutritionAnalysisResult,
    payload?: { photoPreviewUri?: string | null; photoPayload?: string | null },
  ) => void;
  onPlanNeedsReview: (result: PlanPdfAnalysisResult) => void;
};

export function DevtoolsAnalysisCard({
  view,
  photoAttachments,
  planPdfAttachments,
  onChangePhotoAttachments,
  onChangePlanPdfAttachments,
  onSelectView,
  onNutritionNeedsReview,
  onPlanNeedsReview,
}: Props) {
  return (
    <View style={s.analysisCard}>
      <View style={s.analysisGlowTop} />
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionTitle}>Analisar refeicao</Text>
          <Text style={s.analysisSubtitle}>Envie uma foto para estimar calorias e macros da refeicao.</Text>
        </View>
        <View style={s.analysisBadge}>
          <Ionicons name="sparkles-outline" size={14} color={Brand.greenDark} />
        </View>
      </View>

      <View style={s.analyzerTabRow}>
        <ToolTab label="Foto" active={view === 'photo'} onPress={() => onSelectView('photo')} />
        {view === 'audio' ? <ToolTab label="Voz" active onPress={() => onSelectView('audio')} /> : null}
        {view === 'plan' ? <ToolTab label="Plano alimentar" active onPress={() => onSelectView('plan')} /> : null}
      </View>

      {view === 'photo' ? (
        <PhotoNutritionAnalyzer
          attachments={photoAttachments}
          onChangeAttachments={onChangePhotoAttachments}
          onRequiresReview={(result, payload) => onNutritionNeedsReview('photo', result, payload)}
        />
      ) : null}
      {view === 'audio' ? (
        <AudioNutritionAnalyzer onRequiresReview={(result) => onNutritionNeedsReview('audio', result)} />
      ) : null}
      {view === 'plan' ? (
        <PdfPlanAnalyzer
          attachments={planPdfAttachments}
          onChangeAttachments={onChangePlanPdfAttachments}
          onRequiresReview={onPlanNeedsReview}
        />
      ) : null}
    </View>
  );
}

function ToolTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[s.toolTab, active && s.toolTabActive]} onPress={onPress}>
      <Text style={[s.toolTabText, active && s.toolTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  analysisCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  analysisGlowTop: {
    position: 'absolute',
    top: -72,
    right: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(123,196,127,0.16)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  analysisSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  analysisBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E7F6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzerTabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolTab: {
    borderRadius: 999,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolTabText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  toolTabActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  toolTabTextActive: {
    color: Brand.greenDark,
  },
});
