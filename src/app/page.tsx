'use client';

import { useState } from "react";
import { computeChart } from "../lib/numerology";
import { SectionNav } from "../components/SectionNav";
import { ThemeToggle } from "../components/ThemeToggle";
import { InputSection } from "../components/sections/InputSection";
import { ChartSection } from "../components/sections/ChartSection";
import { AiSummarySection } from "../components/sections/AiSummarySection";
import { StorySection } from "../components/sections/StorySection";
import { HiddenCharacterSection } from "../components/sections/HiddenCharacterSection";
import { AbilitySection } from "../components/sections/AbilitySection";
import { HealthSection } from "../components/sections/HealthSection";
import { CareerSection } from "../components/sections/CareerSection";
import { DirectionsSection } from "../components/sections/DirectionsSection";
import { PlaceholderSection } from "../components/sections/PlaceholderSection";
import { PlanetsSection } from "../components/sections/PlanetsSection";
import { FiveElementsSection } from "../components/sections/FiveElementsSection";
import './globals.css'

export default function Home() {
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [ic, setIc] = useState("");
  const chart = computeChart(birthDate);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-b from-amber-100 to-amber-50 font-sans">
      <SectionNav />
      <ThemeToggle />
      <main className="flex flex-1 w-full max-w-6xl flex-col gap-10 pt-20 pb-32 px-4 sm:px-8 lg:px-16">
        <header className="title-container w-full flex-col items-start gap-2 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-100 to-white px-8 py-10 text-left shadow-sm ring-1 ring-amber-100/50">
          <h1 className="title">天数字学数姿艺</h1>
          <p className="text-base text-amber-800/80">生命灵数 · 个人命盘解析</p>
        </header>

        <div id="sec-input" className="w-full scroll-mt-24">
          <InputSection
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
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
        <div id="sec-extra1" className="w-full scroll-mt-24">
          <PlanetsSection birthDate={birthDate} ic={ic} phone={phone} chart={chart} />
        </div>
        <div id="sec-elements" className="w-full scroll-mt-24">
          <FiveElementsSection birthDate={birthDate} phone={phone} chart={chart} />
        </div>
      </main>
    </div>
  );
}
