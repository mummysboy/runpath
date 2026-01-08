'use client';

import { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, Highlighter, Type, AlignLeft } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string, formatting: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  disabled = false,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const getSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
  };

  const restoreSelection = (range: Range) => {
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const applyFormat = (command: string, value?: string) => {
    const range = getSelection();
    if (!range || !editorRef.current) return;

    // Save selection
    const savedRange = range.cloneRange();
    
    document.execCommand(command, false, value);
    
    // Restore focus
    editorRef.current.focus();
    
    // Get updated content and extract formatting
    const content = editorRef.current.innerHTML;
    const formatting = extractFormatting(editorRef.current);
    
    onChange(content, formatting);
  };

  const extractFormatting = (element: HTMLElement): any => {
    const formatting: any = {
      bold: false,
      italic: false,
      underline: false,
      highlight: false,
      allCaps: false,
    };

    // Check if entire text has formatting
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let hasBold = false;
    let hasItalic = false;
    let hasUnderline = false;
    let hasHighlight = false;
    let nodeCount = 0;

    while (walker.nextNode()) {
      nodeCount++;
      let node = walker.currentNode;
      let parent = node.parentElement;

      while (parent && parent !== element) {
        const style = window.getComputedStyle(parent);
        const tagName = parent.tagName.toLowerCase();

        if (tagName === 'b' || tagName === 'strong' || style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600) {
          hasBold = true;
        }
        if (tagName === 'i' || tagName === 'em' || style.fontStyle === 'italic') {
          hasItalic = true;
        }
        if (tagName === 'u' || style.textDecoration.includes('underline')) {
          hasUnderline = true;
        }
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
          hasHighlight = true;
        }

        parent = parent.parentElement;
      }
    }

    formatting.bold = hasBold && nodeCount > 0;
    formatting.italic = hasItalic && nodeCount > 0;
    formatting.underline = hasUnderline && nodeCount > 0;
    formatting.highlight = hasHighlight && nodeCount > 0;

    // Check for all caps
    const textContent = element.textContent || '';
    if (textContent.length > 0 && textContent === textContent.toUpperCase() && /[a-z]/.test(textContent)) {
      formatting.allCaps = true;
    }

    return formatting;
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const formatting = extractFormatting(editorRef.current);
    onChange(content, formatting);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const isFormatActive = (format: string): boolean => {
    if (!editorRef.current) return false;
    return document.queryCommandState(format);
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    label, 
    value,
    onClick 
  }: { 
    icon: any; 
    command?: string; 
    label: string; 
    value?: string;
    onClick?: () => void;
  }) => {
    const isActive = command ? isFormatActive(command) : false;
    
    return (
      <button
        type="button"
        onClick={() => {
          if (onClick) {
            onClick();
          } else if (command) {
            applyFormat(command, value);
          }
        }}
        disabled={disabled}
        className={`
          p-2 rounded hover:bg-[rgba(255,255,255,0.1)] transition
          ${isActive ? 'bg-[rgba(94,160,255,0.2)] text-[#5ea0ff]' : 'text-[#d6dbe5]'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={label}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  const handleAllCaps = () => {
    const range = getSelection();
    if (!range || !editorRef.current) return;

    const selectedText = range.toString();
    if (!selectedText) {
      // Apply to all text
      const allText = editorRef.current.textContent || '';
      editorRef.current.textContent = allText === allText.toUpperCase() 
        ? allText.toLowerCase() 
        : allText.toUpperCase();
    } else {
      // Apply to selected text
      const newText = selectedText === selectedText.toUpperCase()
        ? selectedText.toLowerCase()
        : selectedText.toUpperCase();
      document.execCommand('insertText', false, newText);
    }

    handleInput();
  };

  return (
    <div className={`border border-[rgba(255,255,255,0.08)] rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
        <ToolbarButton 
          icon={Bold} 
          command="bold" 
          label="Bold (Ctrl+B)" 
        />
        <ToolbarButton 
          icon={Italic} 
          command="italic" 
          label="Italic (Ctrl+I)" 
        />
        <ToolbarButton 
          icon={Underline} 
          command="underline" 
          label="Underline (Ctrl+U)" 
        />
        <div className="w-px h-6 bg-[rgba(255,255,255,0.1)] mx-1" />
        <ToolbarButton 
          icon={Highlighter} 
          command="backColor" 
          value="#fef08a"
          label="Highlight" 
        />
        <div className="w-px h-6 bg-[rgba(255,255,255,0.1)] mx-1" />
        <ToolbarButton 
          icon={Type} 
          onClick={handleAllCaps}
          label="Toggle All Caps" 
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          min-h-[120px] max-h-[400px] overflow-y-auto p-4
          bg-[rgba(255,255,255,0.05)] 
          text-[#f4f6fb]
          focus:outline-none focus:bg-[rgba(255,255,255,0.07)]
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${isFocused ? 'ring-2 ring-[rgba(94,160,255,0.3)]' : ''}
        `}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #7a8799;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
