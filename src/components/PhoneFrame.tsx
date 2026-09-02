import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <>
      {/* Mobile: full screen, no frame */}
      <div className="md:hidden h-screen w-full relative overflow-hidden">{children}</div>

      {/* Desktop: centered iPhone frame */}
      <div className="hidden md:flex min-h-screen w-full items-center justify-center bg-[#080b09] p-8 pb-20">
        <div className="relative flex flex-col items-center">
          {/* Phone outer shell */}
          <div className="relative w-[345px] h-[670px] rounded-[44px] bg-[#1a1a1a] p-[11px] shadow-[0_0_0_2px_#2a2a2a,0_20px_60px_-10px_rgba(0,0,0,0.7)]">
            {/* Side buttons */}
            <div className="absolute -left-[3px] top-[100px] w-[3px] h-[25px] rounded-l-sm bg-[#2a2a2a]" />
            <div className="absolute -left-[3px] top-[145px] w-[3px] h-[45px] rounded-l-sm bg-[#2a2a2a]" />
            <div className="absolute -left-[3px] top-[200px] w-[3px] h-[45px] rounded-l-sm bg-[#2a2a2a]" />
            <div className="absolute -right-[3px] top-[155px] w-[3px] h-[60px] rounded-r-sm bg-[#2a2a2a]" />

            {/* Screen — flex column, no scroll at this level */}
            <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-bg flex flex-col">
              {/* Dynamic Island */}
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-full z-50 flex items-center justify-center">
                <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a2e] ml-8" />
              </div>

              {/* App content — fills remaining space */}
              <div className="w-full h-full relative">
                {children}
              </div>

              {/* Home indicator bar */}
              <div className="shrink-0 flex justify-center pb-[6px] pt-1 z-50">
                <div className="w-[134px] h-[5px] bg-white/20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Reflection glow */}
          <div className="w-[280px] h-[8px] bg-[#bdff80]/10 rounded-full blur-xl mt-2" />
        </div>
      </div>
    </>
  );
}
