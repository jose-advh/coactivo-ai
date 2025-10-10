export const ViewDocs = () => {
  const recentFiles = [
    { id: 1, name: "contrato.pdf", date: "2025-10-03" },
    { id: 2, name: "documento.docx", date: "2025-10-02" },
    { id: 3, name: "reporte.xlsx", date: "2025-09-30" },
  ];

  return (
    <div className="w-full md:w-[100%] bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <h2 className="text-lg text-center font-semibold mb-3 text-gray-800">
        Últimos archivos subidos
      </h2>

      <ul className="divide-y divide-gray-200">
        {recentFiles.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors duration-200 px-2 rounded-lg"
          >
            <span className="font-medium text-gray-700 truncate">
              {file.name}
            </span>
            <span className="text-sm text-gray-500">{file.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
