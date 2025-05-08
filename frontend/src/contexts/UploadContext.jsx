import { createContext, useContext, useState } from "react";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

  return (
    <UploadContext.Provider value={{ file, setFile, text, setText }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
