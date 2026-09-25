import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { createRoot } from 'react-dom/client';

import readme from '../../../packages/geotimelapse/README.md?raw';
import './styles.css';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('typescript', typescript);
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' });
hljs.registerLanguage('bash', bash);
hljs.registerAliases(['sh'], { languageName: 'bash' });
hljs.registerLanguage('css', css);

// The package README is the single source of the presentation: what npm
// shows is what the site shows.
const presentation = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight: (code, language) => (hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : code),
  }),
).parse(readme, { async: false });

function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex flex-wrap gap-4 font-mono text-sm">
        <a href="demo/" className="rounded-md border border-white/30 px-4 py-2 hover:bg-white/10">
          demo — a month of French home sales →
        </a>
        <a href="lab/" className="rounded-md border border-white/30 px-4 py-2 hover:bg-white/10">
          glow lab →
        </a>
      </div>
      {/* Our own README — no untrusted markdown goes through here. */}
      <div
        className="prose prose-invert prose-a:text-sky-300 max-w-none"
        dangerouslySetInnerHTML={{ __html: presentation }}
      />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Home />);
