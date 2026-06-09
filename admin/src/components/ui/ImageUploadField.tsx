import { useRef, useState, ChangeEvent, DragEvent } from 'react';
import { uploadTraceMedia } from '../../services/api';
import './ImageUploadField.css';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ImageUploadField({
  value,
  onChange,
  label = '图片 / Image',
  placeholder = '点击或拖拽图片上传，或粘贴 URL',
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadTraceMedia(file);
      onChange(url);
    } catch (e) {
      setError('上传失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  function onUrlChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <div className="iuf-field">
      <label className="iuf-label">{label}</label>
      <div
        className={`iuf-dropzone ${dragOver ? 'iuf-dropzone--over' : ''} ${disabled ? 'iuf-dropzone--disabled' : ''}`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {value ? (
          <img src={value} alt="preview" className="iuf-preview" />
        ) : (
          <div className="iuf-placeholder">
            <div className="iuf-icon">+</div>
            <div>{uploading ? '上传中…' : placeholder}</div>
          </div>
        )}
        {uploading && <div className="iuf-overlay">上传中…</div>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onFileInput}
          disabled={disabled || uploading}
        />
      </div>
      <input
        type="text"
        className="iuf-url"
        value={value || ''}
        onChange={onUrlChange}
        placeholder="或直接粘贴图片 URL"
        disabled={disabled}
      />
      {error && <div className="iuf-error">{error}</div>}
    </div>
  );
}
