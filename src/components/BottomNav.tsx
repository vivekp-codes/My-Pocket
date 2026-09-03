const navIcons = [
  {
    id: "home",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    id: "wallet",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="13" rx="3" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: "add",
    isAdd: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#050805" strokeWidth={2.6} strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: "calendar",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "grid",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <div className="w-full h-[66px] bg-[#0f1411]/85 border border-white/[0.06] backdrop-blur-xl rounded-[26px] flex items-center justify-between px-2.5 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.6)]">
      {navIcons.map((item) =>
        item.isAdd ? (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_10px_22px_-6px_rgba(92,176,16,0.55)] active:scale-90 transition-transform"
            style={{ background: "linear-gradient(155deg, #9AFF45 0%, #73DA14 40%, #5CB010 100%)" }}
          >
            <span className="w-[22px] h-[22px]">{item.svg}</span>
          </button>
        ) : (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`w-[46px] h-[46px] rounded-[18px] flex items-center justify-center transition-colors ${
              activeTab === item.id ? "bg-white text-bg" : "text-textFaint"
            }`}
          >
            <span className="w-5 h-5">{item.svg}</span>
          </button>
        )
      )}
    </div>
  );
}
