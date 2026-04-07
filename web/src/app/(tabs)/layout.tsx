import { TabBar } from "@/components/tab-bar";
import { PushPrompt } from "@/components/push-prompt";
import { PageTransition } from "@/components/page-transition";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--bg-base)]">
      <TabBar />
      <main id="main-content" className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <PushPrompt />
    </div>
  );
}
