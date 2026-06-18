'use client';

import { useInput } from "../components/InputProvider";
import { InputSection } from "../components/sections/InputSection";
import { ChartSection } from "../components/sections/ChartSection";
import { AiSummarySection } from "../components/sections/AiSummarySection";
import { StorySection } from "../components/sections/StorySection";
import { HiddenCharacterSection } from "../components/sections/HiddenCharacterSection";
import { AbilitySection } from "../components/sections/AbilitySection";
import { HealthSection } from "../components/sections/HealthSection";
import { CareerSection } from "../components/sections/CareerSection";
import { DirectionsSection } from "../components/sections/DirectionsSection";

// Main page — 个人蓝图. Uses its own birth date (birthDatePersonalDiagram) and
// chart (personalChart), independent from the 八大行星 page.
export default function Home() {
  const {
    name,
    setName,
    birthDatePersonalDiagram,
    setbirthDatePersonalDiagram,
    phone,
    setPhone,
    ic,
    setIc,
    personalChart,
  } = useInput();

  const birthDate = birthDatePersonalDiagram;
  const chart = personalChart;

  return (
    <>
      <div id="sec-input" className="w-full scroll-mt-24">
        <InputSection
          fields={["name", "birthDate"]}
          name={name}
          onNameChange={setName}
          birthDate={birthDatePersonalDiagram}
          onBirthDateChange={setbirthDatePersonalDiagram}
          phone={phone}
          onPhoneChange={setPhone}
          ic={ic}
          onIcChange={setIc}
        />
      </div>
      <div id="sec-chart" className="w-full scroll-mt-24">
        <ChartSection chart={chart} />
      </div>
      <div id="sec-summary" className="w-full scroll-mt-24">
        <AiSummarySection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-story" className="w-full scroll-mt-24">
        <StorySection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-hidden" className="w-full scroll-mt-24">
        <HiddenCharacterSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-ability" className="w-full scroll-mt-24">
        <AbilitySection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-health" className="w-full scroll-mt-24">
        <HealthSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-career" className="w-full scroll-mt-24">
        <CareerSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-directions" className="w-full scroll-mt-24">
        <DirectionsSection birthDate={birthDate} chart={chart} />
      </div>
    </>
  );
}
