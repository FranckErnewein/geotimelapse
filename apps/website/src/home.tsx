import { marked } from 'marked';
import { createRoot } from 'react-dom/client';

import readme from '../../../packages/geotimelapse/README.md?raw';
import { GlowLab } from './glow-lab.js';
import './styles.css';

// The package README is the single source of the presentation: what npm
// shows is what the site shows.
const presentation = marked.parse(readme, { async: false });

function Home() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-16">
        {/* Our own README — no untrusted markdown goes through here. */}
        <div
          className="prose prose-invert prose-a:text-sky-300 max-w-none"
          dangerouslySetInnerHTML={{ __html: presentation }}
        />
        <p className="mt-12 font-mono text-sm text-white/60">↓ the glow lab: the rendering layer, out of time</p>
      </section>
      <section className="border-t border-white/10">
        <GlowLab />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Home />);
