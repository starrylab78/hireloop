import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export function JobDescriptionEditor({
  value,
  onChange,
  title,
  companyName,
}: {
  value: string;
  onChange: (html: string) => void;
  title?: string;
  companyName?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose prose-neutral max-w-none min-h-[220px] px-4 py-3 focus:outline-none' },
    },
  });

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [bulletsText, setBulletsText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  async function generateWithAi() {
    if (!title?.trim()) {
      setAiError('Add a job title above first — the writer uses it to draft the description.');
      return;
    }
    setGenerating(true);
    setAiError('');
    try {
      const bullets = bulletsText.split('\n').map((b) => b.trim()).filter(Boolean);
      const { data } = await api.post('/jobs/generate-description', { title, companyName, bullets });
      editor?.commands.setContent(data.descriptionHtml);
      onChange(data.descriptionHtml);
      setShowAiPanel(false);
      setBulletsText('');
    } catch {
      setAiError('Could not generate a draft right now — try writing it manually.');
    } finally {
      setGenerating(false);
    }
  }

  if (!editor) return null;

  const btn = (active: boolean) => `rounded-sm p-2 ${active ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper'}`;

  return (
    <div className="rounded-md border border-border bg-white">
      <div className="flex items-center gap-1 border-b border-border p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}><Bold className="h-4 w-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}><Italic className="h-4 w-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}><Heading2 className="h-4 w-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}><List className="h-4 w-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}><ListOrdered className="h-4 w-4" /></button>
        <div className="ml-auto">
          <button type="button" onClick={() => setShowAiPanel((s) => !s)} className="flex items-center gap-1.5 rounded-full bg-loop-tint px-3 py-1.5 text-xs font-medium text-loop hover:bg-loop/20">
            <Sparkles className="h-3.5 w-3.5" />
            Write with AI
          </button>
        </div>
      </div>

      {showAiPanel && (
        <div className="border-b border-border bg-paper p-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Rough notes (one per line) — optional</label>
          <textarea
            value={bulletsText} onChange={(e) => setBulletsText(e.target.value)} rows={3}
            placeholder={'e.g.\nOwns our checkout flow end to end\n3+ years React\nRemote-friendly, some travel'}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-loop"
          />
          {aiError && <p className="mt-1.5 text-xs text-red-600">{aiError}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={generateWithAi} disabled={generating} className="btn-primary py-1.5 px-3 text-xs">
              {generating ? 'Writing…' : 'Generate draft'}
            </button>
            <button type="button" onClick={() => setShowAiPanel(false)} className="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">This replaces the current description — review and edit before publishing.</p>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
