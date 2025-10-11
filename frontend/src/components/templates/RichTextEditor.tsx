import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Link, Image, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

export interface RichTextEditorRef {
  insertVariable: (variable: string) => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  onImageUrlChange?: (imageUrl: string | null) => void;
  placeholder?: string;
  fontSize?: string;
  className?: string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, onImageUrlChange, placeholder, fontSize = '16px', className }, ref) => {
    const [content, setContent] = useState(value);
    const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      setContent(value);
    }
  }, [value]);

    useImperativeHandle(ref, () => ({
      insertVariable: (variable: string) => {
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, variable);
          const newContent = editorRef.current.innerHTML;
          setContent(newContent);
          onChange(newContent);
        }
      },
      getContent: () => content,
      setContent: (newContent: string) => {
        setContent(newContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = newContent;
        }
        onChange(newContent);
      }
    }));

    const handleInput = () => {
      if (editorRef.current) {
        const newContent = editorRef.current.innerHTML;
        setContent(newContent);
        onChange(newContent);
      }
    };

    const applyFormat = (format: string) => {
      if (!editorRef.current) return;
      
      editorRef.current.focus();
      
      switch (format) {
        case 'bold':
          document.execCommand('bold', false);
          break;
        case 'italic':
          document.execCommand('italic', false);
          break;
        case 'underline':
          document.execCommand('underline', false);
          break;
        case 'link':
          const url = prompt('Digite a URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        case 'image':
          const imageUrl = prompt('Digite a URL da imagem:');
          if (imageUrl) {
            document.execCommand('insertImage', false, imageUrl);
            onImageUrlChange?.(imageUrl);
          }
          break;
        case 'list':
          document.execCommand('insertUnorderedList', false);
          break;
        case 'ordered-list':
          document.execCommand('insertOrderedList', false);
          break;
        case 'align-left':
          document.execCommand('justifyLeft', false);
          break;
        case 'align-center':
          document.execCommand('justifyCenter', false);
          break;
        case 'align-right':
          document.execCommand('justifyRight', false);
          break;
        default:
          return;
      }
      
      handleInput();
    };

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('bold')}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('italic')}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('underline')}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('link')}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('image')}
            title="Imagem"
          >
            <Image className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('align-left')}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('align-center')}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('align-right')}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('list')}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('ordered-list')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Editor WYSIWYG com contentEditable */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[200px] p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 prose max-w-none"
          style={{ fontSize }}
          data-placeholder={placeholder}
        />
        
        <style>{`
          [contentEditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
