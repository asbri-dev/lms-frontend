import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Download } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import "ag-grid-community/styles/ag-grid.css";

/* ---------- FLATTEN ---------- */
const flattenObject = (obj, parent = "") => {
  let res = {};
  for (let key in obj) {
    const value = obj[key];
    const newKey = parent ? `${parent}_${key}` : key;
    if (value === null || value === undefined) {
      res[newKey] = "N/A";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(res, flattenObject(value, newKey));
    } else {
      res[newKey] = value;
    }
  }
  return res;
};

/* ---------- MODAL ---------- */
const EmployeeDetailsModal = ({ selectedUser, setSelectedUser }) => {
  if (!selectedUser) return null;
  const renderAll = (obj) =>
    Object.entries(obj || {}).map(([key, val]) => {
      if (typeof val === "object" && val !== null) {
        return (
          <div key={key} className="col-span-2">
            <h3 className="font-semibold text-gray-700">{key}</h3>
            <div className="grid grid-cols-2 gap-2">{renderAll(val)}</div>
          </div>
        );
      }
      return (
        <div
          key={key}
          className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg"
        >
          <span className="text-gray-600">{key}</span>
          <span className="font-medium">{val || "N/A"}</span>
        </div>
      );
    });

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-6 max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-indigo-600">
            Employee Details
          </h2>
          <button
            onClick={() => setSelectedUser(null)}
            className="text-gray-500 hover:text-red-500"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">{renderAll(selectedUser)}</div>
      </div>
    </div>
  );
};

/* ---------- MAIN ---------- */
export function UserManagement() {
  const { user } = useAuth();
  const gridRef = useRef();
  const dropdownRef = useRef();

  const [rowData, setRowData] = useState([]);
  const [allColumns, setAllColumns] = useState([]);
  const [visibleCols, setVisibleCols] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [colSearch, setColSearch] = useState("");

  /* ---------- FETCH ---------- */
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `http://localhost:9090/faculty/getAllRegFacultyDetails?rmEmpId=${user?.employeeId}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [data];

      const flattened = list.map((item) => {
        const flat = flattenObject(item);
        return {
          ...flat,
          raw: item,
          name: `${item.personalDetails?.firstName || ""} ${
            item.personalDetails?.lastName || ""
          }`.trim(),
        };
      });

      // ✅ DEDUPLICATE COLUMNS
      const keyMap = new Map(); // lowercase -> original
      flattened.forEach((row) => {             // 
        Object.keys(row).forEach((k) => {        //
          if (k !== "raw" && k !== "name") {   //
            const lower = k.toLowerCase();
            if (!keyMap.has(lower)) keyMap.set(lower, k);
          }
        });
      });

      const keys = Array.from(keyMap.values());

      // Normalize rows
      const normalized = flattened.map((row) => {
        const newRow = { ...row };
        keys.forEach((k) => {
          if (!(k in newRow)) newRow[k] = "N/A";
        });
        return newRow;
      });

      setRowData(normalized);
      setAllColumns(keys);
      setVisibleCols(keys);
    };

    if (user?.employeeId) fetchData();
  }, [user]);

  /* ---------- CLOSE DROPDOWN ---------- */
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {  //
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ---------- NAME CLICK ---------- */
  const nameCellRenderer = useCallback(
    (params) => (
      <span
        className="text-text-gray-500 font-medium cursor-pointer hover:underline"
        onClick={() => setSelectedUser(params.data.raw)}
      >
        {params.value}
      </span>
    ),
    []
  );

  /* ---------- COLUMN DEFS ---------- */
  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "Name",
        field: "name",
        pinned: "left",
        cellRenderer: nameCellRenderer,
      },
      ...allColumns.map((key) => ({
        headerName: key.split("_").pop(),
        field: key,
        hide: !visibleCols.includes(key),
      })),
    ];
  }, [allColumns, visibleCols, nameCellRenderer]);

  const defaultColDef = {
    flex: 1,
    minWidth: 140,
    resizable: true,
    sortable: true,
    filter: true,
  };

  /* ---------- TOGGLE COLUMN ---------- */
  const toggleColumn = (col) => {
    setVisibleCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]  //////
    );
  };

  /* ---------- SELECT ALL / UNSELECT ALL ---------- */
  const selectAllColumns = () => setVisibleCols([...allColumns]);
  const unselectAllColumns = () => setVisibleCols([]);

  /* ---------- EXPORT ---------- */
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rowData);  //
    const wb = XLSX.utils.book_new();              
    XLSX.utils.book_append_sheet(wb, ws, "Faculty");  
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "Faculty.xlsx");
  };

  /* ---------- FILTERED COLUMNS ---------- */
  const filteredCols = allColumns.filter((c) =>
    c.toLowerCase().includes(colSearch.toLowerCase())
  );

  return (
  <div className="p-6 min-h-screen bg-gray-50 space-y-6">

    {/* ================= HEADER ================= */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Faculty Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage faculty details, permissions, and records
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        {/* COLUMN DROPDOWN */}
        <div className="relative" ref={dropdownRef}>

          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-2 px-4 py-2 
                       bg-white rounded-xl shadow-sm hover:shadow-md 
                       text-sm text-gray-700 transition"
          >
            ⚙ Columns
          </button>

          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-auto 
                            bg-white rounded-xl shadow-xl p-4 z-50 space-y-3">

              {/* SEARCH */}
              <input
                type="text"
                placeholder="Search columns..."
                className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                           focus:ring-2 focus:ring-[#3f548f] outline-none text-sm"
                value={colSearch}
                onChange={(e) => setColSearch(e.target.value)}
              />

              {/* SELECT ACTIONS */}
              <div className="flex justify-between text-xs font-medium">
                <button
                  onClick={selectAllColumns}  
                  className="text-[#2b3c6b] hover:underline"
                >
                  Select All
                </button>

                <button
                  onClick={unselectAllColumns}
                  className="text-red-500 hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* COLUMN LIST */}
              <div className="space-y-1">
                {filteredCols.map((col) => {
                  const isChecked = visibleCols.includes(col);

                  return (
                    <label
                      key={col}
                      className="flex justify-between items-center 
                                 px-2 py-2 rounded-lg text-sm 
                                 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="text-gray-700">
                        {col.split("_").pop()}
                      </span>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col)}
                        className="cursor-pointer accent-[#2b3c6b]"
                      />
                    </label>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* EXPORT */}
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl 
                     bg-[#2b3c6b] text-white hover:bg-[#3f548f] transition shadow-sm"
        >
          <Download size={16} />
          Export
        </button>

      </div>
    </div>


    {/* ================= GRID CARD ================= */}
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">

      {/* SUB HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">
          Faculty List
        </h3>

        <span className="text-xs text-gray-500">
          Total: {rowData?.length || 0}
        </span>
      </div>

      {/* GRID */}
      <div className="ag-theme-alpine w-full h-[600px] rounded-xl overflow-hidden">

        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination
          rowHeight={48}
          headerHeight={45}
        />

      </div>

    </div>


    {/* ================= MODAL ================= */}
    <EmployeeDetailsModal
      selectedUser={selectedUser}
      setSelectedUser={setSelectedUser}
    />

  </div>
);
}