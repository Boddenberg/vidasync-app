import type { Dispatch, SetStateAction } from 'react';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import type { AttachmentItem } from '@/types/attachments';

type DomainFieldProps = {
  value: AttachmentItem[];
  onChange: Dispatch<SetStateAction<AttachmentItem[]>>;
  maxItems?: number;
};

/*
 * Wrappers por dominio para evitar configuracao repetida de contexto/allowedKinds.
 *
 * Chat e analise de plano estao prontos para uso assim que as telas forem criadas.
 * Cadastro de refeicao ja usa o wrapper de meal no fluxo atual.
 */
export function MealAttachmentField({ value, onChange, maxItems = 1 }: DomainFieldProps) {
  return (
    <AttachmentPickerField
      context="meal"
      allowedKinds={['photo']}
      value={value}
      onChange={onChange}
      maxItems={maxItems}
      title="Anexo da refeição"
      subtitle="Use uma foto para salvar junto com a refeição."
    />
  );
}

export function ChatAttachmentField({ value, onChange, maxItems = 3 }: DomainFieldProps) {
  return (
    <AttachmentPickerField
      context="chat"
      allowedKinds={['photo', 'audio', 'pdf']}
      value={value}
      onChange={onChange}
      maxItems={maxItems}
      title="Anexos do chat"
      subtitle="Adicione arquivos para conversar com o assistente."
    />
  );
}

export function PlanAttachmentField({ value, onChange, maxItems = 5 }: DomainFieldProps) {
  return (
    <AttachmentPickerField
      context="plan"
      allowedKinds={['photo', 'pdf', 'audio']}
      value={value}
      onChange={onChange}
      maxItems={maxItems}
      title="Arquivos do plano"
      subtitle="Adicione imagem, PDF ou áudio para analisar seu plano alimentar."
    />
  );
}

