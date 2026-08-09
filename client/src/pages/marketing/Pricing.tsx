import { PricingTable } from '@/components/marketing/PricingTable';

export function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-14 text-center">
        <p className="eyebrow mb-4">Pricing</p>
        <h1 className="font-serif text-4xl md:text-5xl">Plans that scale with your req load</h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-soft">
          Every plan enforces its limits on the server — never trust a hidden button, we don't either.
        </p>
      </div>
      <PricingTable />
    </div>
  );
}
