export async function handleScan({ file, text, setClauseTitles, setError, setLoading }) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);
  
    try {
      const res = await fetch("http://localhost:8000/extract_clause_titles/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setClauseTitles(data.titles || []);
    } catch {
      setError("Failed to scan for clause titles.");
    } finally {
      setLoading(false);
    }
  }
  
  export async function handleExtract({
    file,
    text,
    selectedTitles,
    setClauses,
    setError,
    setLoading,
  }) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);
    formData.append("selected_titles", JSON.stringify(selectedTitles));
  
    try {
      const res = await fetch("http://localhost:8000/extract_selected_clauses/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setClauses(data.clauses || []);
    } catch {
      setError("Failed to extract selected clauses.");
    } finally {
      setLoading(false);
    }
  }
  