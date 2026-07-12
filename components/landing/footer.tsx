import Link from "next/link";
import { AtSign, Globe, MessageCircle, Send } from "lucide-react";

import { Logo } from "@/components/shared/logo";

const columns = [
  {
    title: "Product",
    links: ["Accounts", "Cards", "Savings", "Loans", "Investments"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Press", "Blog"],
  },
  {
    title: "Support",
    links: ["Help center", "Contact us", "Security", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy policy", "Terms of service", "Cookie policy"],
  },
];

export function Footer() {
  return (
    <footer className="border-border/60 border-t px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              Modern digital banking for spending, saving, borrowing and
              investing — all in one beautifully designed app.
            </p>
            <div className="mt-6 flex gap-3">
              {[AtSign, Globe, MessageCircle, Send].map((Icon, i) => (
                <span
                  key={i}
                  className="bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex size-9 items-center justify-center rounded-full transition-colors"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/60 text-muted-foreground mt-12 flex flex-col gap-4 border-t pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nexora Bank. All rights reserved.</p>
          <p>This is a demo application. No real funds are held or transferred.</p>
        </div>
      </div>
    </footer>
  );
}
