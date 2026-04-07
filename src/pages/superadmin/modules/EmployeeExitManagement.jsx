import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const EXIT_REASONS = [
  "Resignation",
  "Retirement",
  "Contract end",
  "Termination",
  "Other",
];

/* ─── Confirm Modal ─── */
const ConfirmModal = ({ emp, onConfirm, onCancel }) => (
  <div style={{ minHeight: 340, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" }}>
    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">Confirm exit process</div>
          <div className="text-xs text-gray-400">This action cannot be undone</div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
        You are about to initiate the exit process for <span className="font-semibold text-gray-800">{emp.employeeName}</span> ({emp.employeeId}).
        Their account will be deactivated on the last working date.
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 text-sm py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 text-sm py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Confirm exit
        </button>
      </div>
    </div>
  </div>
);

/* ─── Exit Form ─── */
const ExitForm = ({ emp, onSubmit, onCancel }) => {
  const [lastDate, setLastDate] = useState("");
  const [reason, setReason]     = useState("Resignation");
  const [notes, setNotes]       = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onSubmit({ ...emp, lastDate, reason, notes });
    setSubmitting(false);
    setShowConfirm(false);
  };

  if (showConfirm) {
    return <ConfirmModal emp={emp} onConfirm={handleConfirm} onCancel={() => setShowConfirm(false)} />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-sm font-semibold text-red-700 flex-shrink-0">
          {(emp.employeeName || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-800">{emp.employeeName}</div>
          <div className="text-xs text-gray-400">{emp.employeeId} · {getLocation(emp.employeeId)}</div>
        </div>
        <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Last working date</label>
          <input
            type="date"
            value={lastDate}
            onChange={(e) => setLastDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Exit reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            {EXIT_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes..."
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 text-sm py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!lastDate || submitting}
          className="flex-1 text-sm py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Initiate exit
        </button>
      </div>
    </div>
  );
};

/* ─── Active Exit Card ─── */
const ActiveExitCard = ({ exit }) => {
  const checklist = [
    { label: "Exit initiated",        done: true  },
    { label: "Admin notified",        done: true  },
    { label: "Last working date set", done: !!exit.lastDate  },
    { label: "Account deactivated",   done: exit.deactivated || false },
  ];
  return (
    <div className="bg-white border border-orange-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-800">{exit.employeeName}</div>
          <div className="text-xs text-gray-400">{exit.employeeId}</div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
          Exit in progress
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {exit.lastDate && <div><span className="text-gray-400">Last date:</span> {exit.lastDate}</div>}
        {exit.reason   && <div><span className="text-gray-400">Reason:</span> {exit.reason}</div>}
      </div>
      <div className="space-y-1.5">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300"
            }`}>
              {item.done ? "✓" : "○"}
            </div>
            <span className={item.done ? "text-gray-600" : "text-gray-400"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const EmployeeExitManagement = () => {
  const [innerTab, setInnerTab]   = useState("initiate"); // "initiate" | "active" | "history"
  const [search, setSearch]       = useState("");
  const [searchResults, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedEmp, setSelected] = useState(null);
  const [activeExits, setActiveExits] = useState([]);
  const [exitHistory, setExitHistory] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);

  const token = sessionStorage.getItem("authToken");

  const searchEmployee = useCallback(async () => {
    if (!search.trim()) return;
    try {
      setSearching(true);
      const res = await fetch(
        `http://localhost:9090/getAllEmployees?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setResults(json.employees || []);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [search, token]);

  const fetchActiveExits = useCallback(async () => {
    try {
      setLoadingActive(true);
      const res = await fetch("http://localhost:9090/getActiveExits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setActiveExits(json.exits || []);
    } catch {
      toast.error("Failed to load active exits");
    } finally {
      setLoadingActive(false);
    }
  }, [token]);

  const fetchExitHistory = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:9090/getExitHistory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setExitHistory(json.exits || []);
    } catch {
      toast.error("Failed to load exit history");
    }
  }, [token]);

  useEffect(() => {
    if (innerTab === "active") fetchActiveExits();
    if (innerTab === "history") fetchExitHistory();
  }, [innerTab, fetchActiveExits, fetchExitHistory]);

  const handleExitSubmit = async (payload) => {
    try {
      const res = await fetch("http://localhost:9090/initiateExit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to initiate exit");
      toast.success(`Exit process initiated for ${payload.employeeName}`);
      setSelected(null);
      setSearch("");
      setResults([]);
    } catch {
      toast.error("Failed to initiate exit process");
    }
  };

  return (
    <div className="space-y-5">

      {/* ─── Inner Tabs ─── */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "initiate", label: "Initiate exit"  },
          { key: "active",   label: "Active exits"   },
          { key: "history",  label: "Exit history"   },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setInnerTab(t.key); setSelected(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              innerTab === t.key
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Initiate Tab ─── */}
      {innerTab === "initiate" && (
        <div className="max-w-lg space-y-4">
          {!selectedEmp ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search employee name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchEmployee()}
                  className="flex-1 border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button
                  onClick={searchEmployee}
                  disabled={searching || !search.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {searchResults.map((emp) => (
                    <button
                      key={emp.employeeId}
                      onClick={() => setSelected(emp)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {(emp.employeeName || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{emp.employeeName}</div>
                        <div className="text-xs text-gray-400">{emp.employeeId} · {emp.department}</div>
                      </div>
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        getLocation(emp.employeeId) === "Palakkad"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {getLocation(emp.employeeId)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {search && searchResults.length === 0 && !searching && (
                <div className="text-center py-10 text-gray-400 text-sm">No employees found</div>
              )}

              {!search && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-sm">Search for an employee to initiate exit process</div>
                </div>
              )}
            </>
          ) : (
            <ExitForm
              emp={selectedEmp}
              onSubmit={handleExitSubmit}
              onCancel={() => setSelected(null)}
            />
          )}
        </div>
      )}

      {/* ─── Active Exits Tab ─── */}
      {innerTab === "active" && (
        <>
          {loadingActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-xl p-4 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <div key={j} className="h-3 bg-gray-100 rounded w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loadingActive && activeExits.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm">No active exit processes</div>
            </div>
          )}
          {!loadingActive && activeExits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeExits.map((exit) => (
                <ActiveExitCard key={exit.employeeId} exit={exit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Exit History Tab ─── */}
      {innerTab === "history" && (
        <>
          {exitHistory.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm">No exit history found</div>
            </div>
          )}
          {exitHistory.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Employee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Last date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exitHistory.map((exit) => (
                    <tr key={exit.employeeId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{exit.employeeName}</div>
                        <div className="text-xs text-gray-400">{exit.employeeId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          getLocation(exit.employeeId) === "Palakkad"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {getLocation(exit.employeeId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{exit.lastDate || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{exit.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {exit.status || "Exited"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeExitManagement;
