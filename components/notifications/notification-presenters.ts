import { Brand } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';

const notificationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const notificationTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNotificationMoment(notification: AppNotification) {
  const createdAt = new Date(notification.createdAt);
  if (!Number.isNaN(createdAt.getTime())) {
    return `${notificationDateFormatter.format(createdAt)} às ${notificationTimeFormatter.format(createdAt)}`;
  }

  if (notification.date && notification.time) {
    const fallback = new Date(`${notification.date}T${notification.time}Z`);
    if (!Number.isNaN(fallback.getTime())) {
      return `${notificationDateFormatter.format(fallback)} às ${notificationTimeFormatter.format(fallback)}`;
    }
  }

  return 'Agora há pouco';
}

export function getNotificationTypePalette(type: AppNotification['type']) {
  switch (type) {
    case 'SUCCESS':
      return {
        label: 'Concluído',
        icon: 'checkmark-circle-outline' as const,
        iconColor: Brand.greenDark,
        iconBg: '#E9F8EE',
        border: '#D7ECDD',
        accent: Brand.greenDark,
        accentSoft: '#EAF7EE',
      };
    case 'WARNING':
      return {
        label: 'Atenção',
        icon: 'alert-circle-outline' as const,
        iconColor: '#B45309',
        iconBg: '#FFF4DD',
        border: '#F2E4BD',
        accent: '#B45309',
        accentSoft: '#FFF4DD',
      };
    case 'ALERT':
      return {
        label: 'Alerta',
        icon: 'notifications-outline' as const,
        iconColor: Brand.danger,
        iconBg: '#FFEDEE',
        border: '#F4D8DB',
        accent: Brand.danger,
        accentSoft: '#FFF1F3',
      };
    default:
      return {
        label: 'Mensagem',
        icon: 'chatbubble-ellipses-outline' as const,
        iconColor: Brand.blue,
        iconBg: '#EAF1FF',
        border: '#DAE5FF',
        accent: Brand.blue,
        accentSoft: '#EEF5FF',
      };
  }
}
