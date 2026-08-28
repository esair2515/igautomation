import type { ReactNode } from "react";
import "./globals.css";
import "./ai-studio.css";
import "./content.css";
import "./content-filters.css";
import "./auth.css";
import "./accounts.css";
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
