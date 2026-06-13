import { Section } from "../Section";

const inputClass =
  "w-full rounded-md border border-amber-200 px-3 py-2 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";
const fieldClass = "flex min-w-0 flex-1 flex-col gap-1";
const labelClass = "text-left text-sm font-medium text-zinc-700";

export function InputSection({
  birthDate,
  onBirthDateChange,
}: {
  birthDate: string;
  onBirthDateChange: (value: string) => void;
}) {
  return (
    <Section title="核心资料">
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className={fieldClass}>
          <label htmlFor="name" className={labelClass}>出生姓名</label>
          <input id="name" type="text" suppressHydrationWarning className={inputClass} />
        </div>
        <div className={fieldClass}>
          <label htmlFor="birthDate" className={labelClass}>出生日期</label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => onBirthDateChange(e.target.value)}
            suppressHydrationWarning
            className={inputClass}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="phoneNumber" className={labelClass}>手机号码</label>
          <input id="phoneNumber" type="tel" suppressHydrationWarning className={inputClass} />
        </div>
      </div>
    </Section>
  );
}
