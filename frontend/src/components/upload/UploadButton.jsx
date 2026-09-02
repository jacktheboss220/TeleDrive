import { useRef } from 'react';
import { Upload } from 'lucide-react';

export default function UploadButton({ onFiles }) {
  const inputRef = useRef();

  return (
    <>
      <button
        onClick={() => inputRef.current.click()}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        <Upload size={16} />
        Upload
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </>
  );
}
