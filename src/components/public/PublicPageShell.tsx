import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicThemeProvider } from "@/components/public/PublicThemeProvider";

type PublicPageShellProps = {
  children: ReactNode;
  background?: ReactNode;
};

export function PublicPageShell({ children, background }: PublicPageShellProps) {
  const hasImmersiveBackground = Boolean(background);

  return (
    <PublicThemeProvider>
      <div className="public-site relative isolate min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        {background ? (
          <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-dvh w-full overflow-hidden">
              {background}
            </div>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] bg-white/8 dark:bg-slate-950/10" />
          </>
        ) : null}

        <div className="relative z-10 min-h-screen">
          <PublicHeader immersive={hasImmersiveBackground} />
          {children}
          <PublicFooter immersive={hasImmersiveBackground} />
        </div>
      </div>
    </PublicThemeProvider>
  );
}
