import { Section } from "../Section";

const inputClass =
  "w-full rounded-md border border-amber-200 px-3 py-2 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";
const fieldClass = "flex min-w-0 flex-1 flex-col gap-1";
const labelClass = "text-left text-sm font-medium text-zinc-700";

export type InputField = "name" | "birthDate" | "phone" | "ic";

const FIELD_DEFS: Record<InputField, { id: string; label: string; type: string }> = {
  name: { id: "name", label: "出生姓名", type: "text" },
  birthDate: { id: "birthDate", label: "出生日期", type: "date" },
  phone: { id: "phoneNumber", label: "电话号码", type: "tel" },
  ic: { id: "ic", label: "身份证号码", type: "text" },
};

export function InputSection({
  fields = ["name", "birthDate", "phone", "ic"],
  name,
  onNameChange,
  birthDate,
  onBirthDateChange,
  phone,
  onPhoneChange,
  ic,
  onIcChange,
}: {
  fields?: InputField[];
  name: string;
  onNameChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  ic: string;
  onIcChange: (value: string) => void;
}) {
  const values: Record<InputField, string> = { name, birthDate, phone, ic };
  const handlers: Record<InputField, (value: string) => void> = {
    name: onNameChange,
    birthDate: onBirthDateChange,
    phone: onPhoneChange,
    ic: onIcChange,
  };

  return (
    <Section title="核心资料">
      {/* Each field is flex-1, so however many are shown they stretch to fill
          the row evenly (no awkward gaps). */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {fields.map((f) => {
          const def = FIELD_DEFS[f];
          return (
            <div key={f} className={fieldClass}>
              <label htmlFor={def.id} className={labelClass}>
                {def.label}
              </label>
              <input
                id={def.id}
                type={def.type}
                value={values[f]}
                onChange={(e) => handlers[f](e.target.value)}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
          );
        })}
      </div>
    </Section>
  );
}
