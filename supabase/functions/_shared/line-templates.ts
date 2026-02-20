/**
 * LINE Flex Message Templates for Automated Push Notifications
 *
 * job_type별 다국어 메시지 템플릿
 * 지원 언어: en (기본), ko, th
 */

export type JobType = 'rebook_due' | 'rebook_overdue' | 'reminder_24h' | 'reminder_3h';
export type Locale = 'ko' | 'en' | 'th';

interface MessagePayload {
  customer_name: string;
  service_name: string;
  salon_name: string;
  booking_url: string;
  // reminder용
  booking_date?: string;
  booking_time?: string;
  artist_name?: string;
}

interface TemplateStrings {
  title: string;
  body: string;
  button_label: string;
}

const TEMPLATES: Record<JobType, Record<Locale, TemplateStrings>> = {
  rebook_due: {
    en: {
      title: "Time for your next visit! ✂️",
      body: "{customer_name}, it's almost time for your {service_name}. Book now at {salon_name}!",
      button_label: "Book Now",
    },
    ko: {
      title: "다음 방문 시기예요! ✂️",
      body: "{customer_name}님, {service_name} 예약 시기가 다가왔어요. {salon_name}에서 예약해보세요!",
      button_label: "예약하기",
    },
    th: {
      title: "ถึงเวลานัดครั้งต่อไปแล้ว! ✂️",
      body: "{customer_name} ใกล้ถึงเวลานัด {service_name} แล้วค่ะ จองคิวที่ {salon_name} เลย!",
      button_label: "จองเลย",
    },
  },
  rebook_overdue: {
    en: {
      title: "We miss you! 💇",
      body: "{customer_name}, it's been a while since your last {service_name}. Come visit {salon_name} again!",
      button_label: "Book Now",
    },
    ko: {
      title: "다시 만나고 싶어요! 💇",
      body: "{customer_name}님, {service_name} 한 지 꽤 되었네요. {salon_name}에서 다시 뵙기를 기다릴게요!",
      button_label: "예약하기",
    },
    th: {
      title: "คิดถึงคุณนะคะ! 💇",
      body: "{customer_name} ไม่ได้มา {service_name} นานแล้วนะคะ มาเยี่ยม {salon_name} อีกครั้งสิคะ!",
      button_label: "จองเลย",
    },
  },
  reminder_24h: {
    en: {
      title: "Appointment Tomorrow 📅",
      body: "{customer_name}, reminder: {service_name} at {salon_name} tomorrow {booking_date} at {booking_time}.",
      button_label: "Confirm",
    },
    ko: {
      title: "내일 예약이 있어요 📅",
      body: "{customer_name}님, 내일 {booking_date} {booking_time}에 {salon_name}에서 {service_name} 예약이 있어요.",
      button_label: "예약 확인",
    },
    th: {
      title: "นัดพรุ่งนี้ 📅",
      body: "{customer_name} แจ้งเตือน: {service_name} ที่ {salon_name} พรุ่งนี้ {booking_date} เวลา {booking_time} ค่ะ",
      button_label: "ยืนยัน",
    },
  },
  reminder_3h: {
    en: {
      title: "See you soon! ⏰",
      body: "{customer_name}, your {service_name} at {salon_name} is in 3 hours ({booking_time}).",
      button_label: "Confirm",
    },
    ko: {
      title: "곧 만나요! ⏰",
      body: "{customer_name}님, {salon_name}에서 {service_name} 예약이 3시간 후 ({booking_time})예요.",
      button_label: "예약 확인",
    },
    th: {
      title: "เจอกันเร็วๆ นี้! ⏰",
      body: "{customer_name} นัด {service_name} ที่ {salon_name} อีก 3 ชั่วโมง ({booking_time}) ค่ะ",
      button_label: "ยืนยัน",
    },
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

/**
 * LINE Flex Message (Button Template) 생성
 */
export function buildLineMessage(
  jobType: JobType,
  locale: Locale,
  payload: MessagePayload,
): Record<string, unknown> {
  const lang = TEMPLATES[jobType][locale] ?? TEMPLATES[jobType].en;

  const vars: Record<string, string> = {
    customer_name: payload.customer_name,
    service_name: payload.service_name,
    salon_name: payload.salon_name,
    booking_date: payload.booking_date ?? '',
    booking_time: payload.booking_time ?? '',
    artist_name: payload.artist_name ?? '',
  };

  const title = interpolate(lang.title, vars);
  const body = interpolate(lang.body, vars);
  const buttonLabel = interpolate(lang.button_label, vars);

  // LINE Flex Message (Bubble type)
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "text",
            text: body,
            size: "sm",
            color: "#666666",
            margin: "md",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: buttonLabel,
              uri: payload.booking_url,
            },
            color: "#5B5EA6",
          },
        ],
        flex: 0,
      },
    },
  };
}
