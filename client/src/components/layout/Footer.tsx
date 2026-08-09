import { Link } from 'react-router-dom';
import { LoopMark } from './Navbar';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink-muted">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="flex items-start gap-2 text-loop">
            <LoopMark className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-serif text-base text-ink">HireLoop</p>
              <p className="mt-1 max-w-xs text-ink-muted">The hiring loop, closed faster — for teams who'd rather ship than sift.</p>
            </div>
          </div>
          <div className="flex gap-16">
            <div>
              <p className="eyebrow mb-3">Product</p>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="hover:text-ink">Find jobs</Link></li>
                <li><Link to="/pricing" className="hover:text-ink">Pricing</Link></li>
                <li><Link to="/register" className="hover:text-ink">Post a job</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-3">Company</p>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-ink">About</Link></li>
                <li><Link to="/careers" className="hover:text-ink">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink-muted">© {new Date().getFullYear()} HireLoop. Built for demo purposes.</p>
      </div>
    </footer>
  );
}
