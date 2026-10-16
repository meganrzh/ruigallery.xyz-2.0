import React from 'react';

export type TextFormat = 'bold' | 'italic' | 'underline';

/**
 * Toggles inline formatting (bold, italic, underline) on a substring of text.
 * Reversible and supports nested/coexisting formats.
 */
export function toggleFormat(
  text: string,
  start: number,
  end: number,
  format: TextFormat
): { text: string; start: number; end: number } {
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const selectedText = text.slice(start, end);

  if (format === 'bold') {
    // 1. Surrounding *** (bold + italic) -> strip bold, leaving *
    if (start >= 3 && text.slice(start - 3, start) === '***' && text.slice(end, end + 3) === '***') {
      return {
        text: text.slice(0, start - 3) + '*' + selectedText + '*' + text.slice(end + 3),
        start: start - 2,
        end: end - 2,
      };
    }
    // 2. Selected ***...*** -> strip bold, leaving *
    if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length >= 6) {
      const inner = selectedText.slice(3, -3);
      return {
        text: text.slice(0, start) + '*' + inner + '*' + text.slice(end),
        start,
        end: start + inner.length + 2,
      };
    }
    // 3. Surrounding ** -> strip bold
    if (start >= 2 && text.slice(start - 2, start) === '**' && text.slice(end, end + 2) === '**') {
      return {
        text: text.slice(0, start - 2) + selectedText + text.slice(end + 2),
        start: start - 2,
        end: end - 2,
      };
    }
    // 4. Selected **...** -> strip bold
    if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
      const inner = selectedText.slice(2, -2);
      return {
        text: text.slice(0, start) + inner + text.slice(end),
        start,
        end: start + inner.length,
      };
    }
    // 5. HTML tags <b>...</b> or <strong>...</strong>
    if (selectedText.startsWith('<b>') && selectedText.endsWith('</b>') && selectedText.length >= 7) {
      const inner = selectedText.slice(3, -4);
      return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
    }
    if (selectedText.startsWith('<strong>') && selectedText.endsWith('</strong>') && selectedText.length >= 17) {
      const inner = selectedText.slice(8, -9);
      return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
    }
    // Toggle ON: wrap in **
    return {
      text: text.slice(0, start) + '**' + selectedText + '**' + text.slice(end),
      start: selectedText ? start : start + 2,
      end: selectedText ? end + 4 : start + 2,
    };
  }

  if (format === 'italic') {
    // 1. Surrounding *** (bold + italic) -> strip italic, leaving **
    if (start >= 3 && text.slice(start - 3, start) === '***' && text.slice(end, end + 3) === '***') {
      return {
        text: text.slice(0, start - 3) + '**' + selectedText + '**' + text.slice(end + 3),
        start: start - 1,
        end: end - 1,
      };
    }
    // 2. Selected ***...*** -> strip italic, leaving **
    if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length >= 6) {
      const inner = selectedText.slice(3, -3);
      return {
        text: text.slice(0, start) + '**' + inner + '**' + text.slice(end),
        start,
        end: start + inner.length + 4,
      };
    }
    // 3. Surrounding * (and not second *)
    if (
      start >= 1 &&
      text[start - 1] === '*' &&
      text[start - 2] !== '*' &&
      text[end] === '*' &&
      text[end + 1] !== '*'
    ) {
      return {
        text: text.slice(0, start - 1) + selectedText + text.slice(end + 1),
        start: start - 1,
        end: end - 1,
      };
    }
    // 4. Selected *...* (and not **)
    if (
      selectedText.startsWith('*') &&
      !selectedText.startsWith('**') &&
      selectedText.endsWith('*') &&
      !selectedText.endsWith('**') &&
      selectedText.length >= 2
    ) {
      const inner = selectedText.slice(1, -1);
      return {
        text: text.slice(0, start) + inner + text.slice(end),
        start,
        end: start + inner.length,
      };
    }
    // 5. HTML tags <i>...</i> or <em>...</em>
    if (selectedText.startsWith('<i>') && selectedText.endsWith('</i>') && selectedText.length >= 7) {
      const inner = selectedText.slice(3, -4);
      return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
    }
    if (selectedText.startsWith('<em>') && selectedText.endsWith('</em>') && selectedText.length >= 9) {
      const inner = selectedText.slice(4, -5);
      return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
    }
    // Toggle ON: wrap in *
    return {
      text: text.slice(0, start) + '*' + selectedText + '*' + text.slice(end),
      start: selectedText ? start : start + 1,
      end: selectedText ? end + 2 : start + 1,
    };
  }

  if (format === 'underline') {
    // 1. Surrounding <u>...</u>
    if (start >= 3 && text.slice(start - 3, start) === '<u>' && text.slice(end, end + 4) === '</u>') {
      return {
        text: text.slice(0, start - 3) + selectedText + text.slice(end + 4),
        start: start - 3,
        end: end - 3,
      };
    }
    // 2. Selected <u>...</u>
    if (selectedText.startsWith('<u>') && selectedText.endsWith('</u>') && selectedText.length >= 7) {
      const inner = selectedText.slice(3, -4);
      return {
        text: text.slice(0, start) + inner + text.slice(end),
        start,
        end: start + inner.length,
      };
    }
    // Toggle ON: wrap in <u>...</u>
    return {
      text: text.slice(0, start) + '<u>' + selectedText + '</u>' + text.slice(end),
      start: selectedText ? start : start + 3,
      end: selectedText ? end + 7 : start + 3,
    };
  }

  return { text, start, end };
}

// Regex to identify supported inline tokens
const INLINE_TOKEN_REGEX = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|\*[^\s*](?:[\s\S]*?[^\s*])?\*|<b>[\s\S]+?<\/b>|<strong>[\s\S]+?<\/strong>|<i>[\s\S]+?<\/i>|<em>[\s\S]+?<\/em>|<u>[\s\S]+?<\/u>)/;

/**
 * Safely parses inline formatted text (bold, italic, underline) into React elements.
 * Prevents arbitrary HTML or XSS: only supported semantic elements are created via React.createElement.
 */
export function renderFormattedText(text: string, keyPrefix = 'fmt'): React.ReactNode {
  if (!text) return text;

  const parts = text.split(INLINE_TOKEN_REGEX);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (!part) return null;
    const currentKey = `${keyPrefix}-${index}`;

    // Bold + Italic: ***...***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      const inner = part.slice(3, -3);
      return (
        <strong key={currentKey} className="font-semibold text-[#141413]">
          <em className="italic">{renderFormattedText(inner, `${currentKey}-bi`)}</em>
        </strong>
      );
    }

    // Bold: **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={currentKey} className="font-semibold text-[#141413]">
          {renderFormattedText(inner, `${currentKey}-b`)}
        </strong>
      );
    }

    // Bold tags: <b> or <strong>
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      const inner = part.slice(3, -4);
      return (
        <strong key={currentKey} className="font-semibold text-[#141413]">
          {renderFormattedText(inner, `${currentKey}-b`)}
        </strong>
      );
    }
    if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
      const inner = part.slice(8, -9);
      return (
        <strong key={currentKey} className="font-semibold text-[#141413]">
          {renderFormattedText(inner, `${currentKey}-b`)}
        </strong>
      );
    }

    // Italic: *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={currentKey} className="italic">
          {renderFormattedText(inner, `${currentKey}-i`)}
        </em>
      );
    }

    // Italic tags: <i> or <em>
    if (part.startsWith('<i>') && part.endsWith('</i>')) {
      const inner = part.slice(3, -4);
      return (
        <em key={currentKey} className="italic">
          {renderFormattedText(inner, `${currentKey}-i`)}
        </em>
      );
    }
    if (part.startsWith('<em>') && part.endsWith('</em>')) {
      const inner = part.slice(4, -5);
      return (
        <em key={currentKey} className="italic">
          {renderFormattedText(inner, `${currentKey}-i`)}
        </em>
      );
    }

    // Underline: <u>...</u>
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      const inner = part.slice(3, -4);
      return (
        <span key={currentKey} className="underline underline-offset-3">
          {renderFormattedText(inner, `${currentKey}-u`)}
        </span>
      );
    }

    return part;
  });
}

/**
 * Compact Textarea with inline B / I / U controls and keyboard shortcuts (Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+U).
 */
export const FormattedTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  label?: string;
  italicFont?: boolean;
}> = ({
  value,
  onChange,
  rows = 4,
  placeholder,
  className = 'w-full p-2.5 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base text-[#141413]',
  label,
  italicFont = false,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: TextFormat) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const res = toggleFormat(value, start, end, format);

    onChange(res.text);

    // Restore selection and focus cleanly on the next frame
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(res.start, res.end);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        applyFormat('bold');
      } else if (key === 'i') {
        e.preventDefault();
        applyFormat('italic');
      } else if (key === 'u') {
        e.preventDefault();
        applyFormat('underline');
      }
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-[#8C8C82] text-[10px] font-mono-archival">
        <span className="uppercase tracking-wider">{label || 'Text Content'}</span>
        <div className="flex items-center border border-[#E5E3DB] bg-[#FBFBFA] p-0.5 divide-x divide-[#E5E3DB] rounded-xs shadow-2xs">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            title="Bold (Ctrl+B / ⌘B)"
            aria-label="Format bold"
            className="px-2 py-0.5 font-bold hover:bg-[#EAE8E0] text-[#141413] text-xs transition-colors cursor-pointer"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            title="Italic (Ctrl+I / ⌘I)"
            aria-label="Format italic"
            className="px-2 py-0.5 italic font-serif hover:bg-[#EAE8E0] text-[#141413] text-xs transition-colors cursor-pointer"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            title="Underline (Ctrl+U / ⌘U)"
            aria-label="Format underline"
            className="px-2 py-0.5 underline hover:bg-[#EAE8E0] text-[#141413] text-xs transition-colors cursor-pointer"
          >
            U
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${italicFont ? 'italic' : ''}`}
      />
    </div>
  );
};
