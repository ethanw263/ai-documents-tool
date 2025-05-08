export default function FileUploadSection({ file, setFile, text, setText, loading, error, onScan, onExtract }) {
    return (
      <div className="space-y-4">
        <label className="block font-semibold text-lg">Upload PDF</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <label className="block font-semibold text-lg">Or Paste Raw Text</label>
        <textarea
          className="w-full border rounded p-3 h-40 resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-4">
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            onClick={onScan}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Scan for Clause Headings"}
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onExtract}
            disabled={loading}
          >
            {loading ? "Extracting..." : "Extract Selected Clauses"}
          </button>
        </div>
        {error && <p className="text-red-600 font-medium pt-2">{error}</p>}
      </div>
    );
  }
  