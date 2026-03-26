import { TabBar } from "@/components/tab-bar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <main id="main-content" className="flex-1 overflow-y-auto pb-16 md:pb-0 md:pl-16">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
