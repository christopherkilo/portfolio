import { Button } from "@/components/demos/novatech/ui/Button";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { CTA } from "@/lib/demos/novatech/constants";
import { contactHref } from "@/lib/demos/novatech/paths";

type CtaBandProps = {
  serviceId?: string;
  title?: string;
  description?: string;
};

export function CtaBand({
  serviceId,
  title = "Ready for technology that supports the business—not the other way around?",
  description = "Request a consultation through the production-shaped inquiry flow. Submissions are verified and delivered when integrations are configured.",
}: CtaBandProps) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <Reveal>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl gradient-band px-6 py-9 text-band-ink sm:px-8 sm:py-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm text-band-ink/80 md:text-base">
              {description}
            </p>
          </div>
          <Button
            href={contactHref(serviceId)}
            variant="outline"
            className="shrink-0 border-band-ink/30 bg-band-action text-band-action-ink hover:bg-band-action/90"
          >
            {CTA.primary}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
