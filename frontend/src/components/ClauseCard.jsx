export default function ClauseCard({ clauses, setClauses }) {
    const handleEdit = (index, field, value) => {
      const updated = [...clauses];
      updated[index][field] = value;
      setClauses(updated);
    };
  
    const handleCopy = (text) => {
      navigator.clipboard.writeText(text);
      alert("Clause copied to clipboard!");
    };
  
    const handleDelete = (index) => {
      const updated = clauses.filter((_, i) => i !== index);
      setClauses(updated);
    };
  
    if (!clauses.length) return null;
  
    return (
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📄 Extracted Clauses</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {clauses.map((clause, index) => (
            <div key={index} className="bg-white shadow rounded p-6 border space-y-4">
              <input
                className="font-bold text-xl w-full border-b pb-1"
                value={clause.title}
                onChange={(e) => handleEdit(index, "title", e.target.value)}
              />
              <input
                className="w-full border rounded px-4 py-3 text-gray-700 italic"
                value={clause.summary}
                onChange={(e) => handleEdit(index, "summary", e.target.value)}
              />
              <input
                className="w-full border rounded px-4 py-3 text-gray-800 font-mono"
                value={clause.text}
                onChange={(e) => handleEdit(index, "text", e.target.value)}
              />
              <div className="flex gap-6 pt-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleCopy(clause.text)}
                >
                  📋 Copy
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(index)}
                >
                  ❌ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  