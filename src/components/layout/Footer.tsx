import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/data";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-paper-dim">
      <Container className="flex flex-col gap-10 py-16 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-2xl uppercase text-ink">Meridian</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Abayas, burqas, niqabs, and hijabs for women and girls — full
            coverage, breathable fabrics, considered cuts.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
              [ Navigate ]
            </span>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
              [ Follow ]
            </span>
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Container>

      <Container className="border-t border-line py-6">
        <p className="text-xs text-ink-soft">
          &copy; {year} Meridian. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
