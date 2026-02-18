import React, { useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, Heading2, Heading3, 
  Link as LinkIcon, Image as LucideImage, Video as LucideVideo,
  Code, Quote
} from 'lucide-react';

interface EnhancedBlogEditorProps {
  content: string;
  coverImage: string;
  title: string;
  onContentChange: (content: string) => void;
  onMediaClick: () => void;
}

const EnhancedBlogEditor: React.FC<EnhancedBlogEditorProps> = ({
  content,
  coverImage,
  title,
  onContentChange,
  onMediaClick
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = content.substring(start, end) || 'text';
    
    const newContent = 
      content.substring(0, start) +
      before + selectedText + after +
      content.substring(end);

    onContentChange(newContent);
    
    setTimeout(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const renderPreview = (markdown: string) => {
    // Simple markdown to HTML preview
    let html = markdown;
    
    // Code blocks (must be first to preserve their content)
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      return `<pre class="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-auto my-4">${match.replace(/```/g, '')}</pre>`;
    });

    // Inline code (before other inline processing)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>');

    // Images (BEFORE bold/italic which also use * and [])
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-4" />');

    // Videos
    html = html.replace(/<video[^>]*src="([^"]+)"[^>]*><\/video>/g, '<div class="my-4 rounded overflow-hidden"><video src="$1" controls class="w-full" /></div>');

    // Lists (BEFORE bold/italic to prevent * confusion)
    html = html.replace(/(^[\*\-] .+$(\n[\*\-] .+$)*)/gm, (match) => {
      const items = match.split('\n').map(line => {
        const text = line.replace(/^[\*\-] /, '').trim();
        // Apply bold/italic within list items
        return text
          .replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
          .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
          .replace(/_([^_]+)_/g, '<em>$1</em>');
      });
      return `<ul class="list-disc my-2">${items.map(item => `<li class="ml-6">${item}</li>`).join('')}</ul>`;
    });

    // Blockquotes - process blocks of consecutive lines starting with >
    html = html.replace(/(^> .+$(\n> .+$)*)/gm, (match) => {
      const lines = match.split('\n').map(line => line.replace(/^> /, '').trim());
      return `<blockquote class="border-l-4 border-[#007BFF] pl-4 italic text-gray-600 my-2">${lines.join('<br />')}</blockquote>`;
    });

    // Headings
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-black uppercase tracking-widest mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-black uppercase tracking-widest mt-8 mb-3">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-4xl font-black uppercase tracking-widest mt-10 mb-4">$1</h1>');

    // Bold and italic (AFTER lists to avoid conflicts)
    html = html.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-[#007BFF] hover:underline" target="_blank">$1</a>');

    // Line breaks to paragraphs
    html = html.split('\n\n').map(para => {
      if (para.match(/<(h[1-6]|ul|blockquote|pre|img|video)/)) return para;
      return `<p class="my-3 leading-relaxed">${para}</p>`;
    }).join('');

    return html;
  };

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Editor Panel */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b p-3 flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 border-r pr-3">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              title="Tučný text"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              title="Kurzíva"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <Italic size={16} />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-3">
            <button
              type="button"
              onClick={() => insertMarkdown('# ')}
              title="Nadpis H1"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black text-sm font-black"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ')}
              title="Nadpis H2"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black text-sm font-black"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('### ')}
              title="Nadpis H3"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black text-sm font-black"
            >
              H3
            </button>
          </div>

          <div className="flex gap-1 border-r pr-3">
            <button
              type="button"
              onClick={() => insertMarkdown('* ')}
              title="Seznam"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ')}
              title="Citace"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <Quote size={16} />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-3">
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](url)')}
              title="Odkaz"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <LinkIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onMediaClick}
              title="Vložit fotku"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <LucideImage size={16} />
            </button>
            <button
              type="button"
              onClick={onMediaClick}
              title="Vložit video"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <LucideVideo size={16} />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insertMarkdown('```\n', '\n```')}
              title="Kód"
              className="p-2 hover:bg-gray-200 rounded transition-all text-gray-700 hover:text-black"
            >
              <Code size={16} />
            </button>
          </div>

          <div className="flex-1" />
          
          <span className="text-[10px] text-gray-500 uppercase">💡 Markdown editor</span>
        </div>

        {/* Editor */}
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          id="editor-content"
          className="flex-1 p-4 resize-none font-mono text-sm border-0 focus:outline-none focus:ring-0"
          placeholder="Napiš obsah článku... (Markdown syntaxe)"
          spellCheck="true"
        />

        <div className="bg-gray-50 border-t p-3 text-[10px] text-gray-500 uppercase">
          📝 {content.length} znaků • {Math.ceil(content.split(/\s+/).length)} slov
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded overflow-hidden">
        <div className="bg-gray-50 border-b p-3 text-[10px] font-black uppercase text-gray-700">
          👁️ Náhled
        </div>

        <div className="flex-1 overflow-auto p-6 prose prose-sm max-w-none">
          {coverImage && (
            <img src={coverImage} alt="Cover" className="w-full h-48 object-cover rounded mb-6" />
          )}

          {title && (
            <h1 className="text-4xl font-black uppercase tracking-widest mb-4">{title}</h1>
          )}

          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
          />

          {!content && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-[12px] font-black uppercase">Náhled se objeví zde...</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-t p-3 text-[10px] text-gray-500 uppercase text-center">
          Jak bude článek vypadat
        </div>
      </div>
    </div>
  );
};

export default EnhancedBlogEditor;
