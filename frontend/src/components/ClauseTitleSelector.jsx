export default function ClauseTitleSelector({ titles, selected, setSelected }) {
    const toggle = (title) => {
      setSelected(
        selected.includes(title)
          ? selected.filter((t) => t !== title)
          : [...selected, title]
      );
    };
  
    if (!titles.length) return null;
  
    return (
      <div className="bg-gray-100 border rounded p-4">
        <h2 className="text-xl font-semibold mb-2">📚 Detected Clause Headings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {titles.map((title, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(title)}
                onChange={() => toggle(title)}
              />
              <span className="text-gray-800">{title}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }
  