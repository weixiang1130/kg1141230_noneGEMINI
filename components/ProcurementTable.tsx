import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Lock, Calendar, ChevronLeft, ChevronRight, Layers, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { ProcurementRow, UserRole } from '../types';
import { calculateVariance, calculateDuration, getVarianceColor } from '../utils';

// Role Definitions for Display
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: '管理員 (完整權限)',
  PLANNER: '工地排程 (採購部)',
  EXECUTOR: '工地執行 (工地單位)',
  PROCUREMENT: '採購發包 (採購部)'
};

// BufferedInput component
const BufferedInput = ({
  value,
  onCommit,
  className,
  placeholder,
  type = 'text',
  disabled = false
}: {
  value: string;
  onCommit: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isComposing = useRef(false);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing.current) {
      onCommit(localValue);
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    onCommit(localValue);
  };

  return (
    <input
      type={type}
      value={localValue}
      disabled={disabled}
      onCompositionStart={() => { isComposing.current = true; }}
      onCompositionEnd={() => { isComposing.current = false; }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} ${disabled ? 'bg-transparent text-gray-400 cursor-not-allowed' : 'bg-transparent text-slate-900 focus:ring-2 focus:ring-blue-500 placeholder-slate-300'}`}
      placeholder={disabled ? '' : placeholder}
    />
  );
};

// Custom Date Picker Modal Component
const CustomDatePicker = ({
  isOpen,
  onClose,
  onSelect,
  initialDate
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate: string;
}) => {
  if (!isOpen) return null;

  const [viewDate, setViewDate] = useState(() => {
    const isValidDate = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate);
    if (isValidDate) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleToday = () => setViewDate(new Date());

  const handleDayClick = (day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    onSelect(`${year}-${m}-${d}`);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const isSelected = initialDate === dateStr;
    const today = new Date();
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;

    days.push(
      <button
        type="button"
        key={i}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDayClick(i); }}
        className={`
          h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer
          ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-slate-700'}
          ${!isSelected && isToday ? 'border border-blue-400 font-bold text-blue-600' : ''}
        `}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[320px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
          <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <div className="font-bold text-lg tracking-wide">{year}年 {month + 1}月</div>
          <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <span key={d} className="text-xs font-semibold text-gray-400">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center">{days}</div>
        </div>
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
          <button type="button" onClick={handleToday} className="text-sm text-blue-600 font-medium hover:text-blue-800 px-2 py-1">跳至今天</button>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 font-medium hover:text-gray-700 px-3 py-1 hover:bg-gray-200 rounded">取消</button>
        </div>
      </div>
    </div>
  );
};

const DateInput = ({
  value,
  onChange,
  className,
  disabled = false,
  onOpenPicker
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
  onOpenPicker: () => void;
}) => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!value) {
      setIsValid(true);
      return;
    }
    setIsValid(/^\d{4}-\d{2}-\d{2}$/.test(value));
  }, [value]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  };

  return (
    <div className="flex items-center w-full gap-1 group/date">
      <input
        type="text"
        value={value || ''}
        disabled={disabled}
        placeholder="-"
        maxLength={10}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`${className} flex-1 text-center bg-transparent text-slate-900 ${!disabled ? 'cursor-text' : ''} ${!isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
      />
      {!disabled && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenPicker(); }}
          className="opacity-0 group-hover/date:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all flex-shrink-0"
          title="開啟日曆"
        >
          <Calendar size={14} />
        </button>
      )}
    </div>
  );
};

const INITIAL_ROWS: ProcurementRow[] = [
  {
    id: '1',
    projectId: 'default-project',
    remarks: '',
    projectName: 'A1-主塔樓',
    engineeringItem: '鋼結構工程',
    scheduledRequestDate: '2023-10-01',
    actualRequestDate: '2023-10-05',
    siteOrganizer: '王小明',
    procurementOrganizer: '李大華',
    procurementSignOffDate: '',
    controlledDuration: '14',
    contractorConfirmDate: '',
    contractorName: ''
  },
  {
    id: '2',
    projectId: 'default-project',
    remarks: '需優先處理',
    projectName: 'B2-裙樓',
    engineeringItem: '混凝土澆置',
    scheduledRequestDate: '2023-10-15',
    actualRequestDate: '2023-10-10',
    siteOrganizer: '王小明',
    procurementOrganizer: '陳採購',
    procurementSignOffDate: '',
    controlledDuration: '20',
    contractorConfirmDate: '',
    contractorName: ''
  }
];

const STORAGE_KEY = 'procurement_schedule_data';

interface ProcurementTableProps {
  currentProjectId: string;
  currentProjectName: string;
  userRole: UserRole;
  onLogout: () => void;
  onBackToHome: () => void;
}

const getTrafficLight = (delay: number) => {
  if (delay > 30) return { color: 'bg-red-600', text: '嚴重' };
  if (delay >= 8) return { color: 'bg-yellow-400', text: '警示' };
  return { color: 'bg-green-500', text: '正常' };
};

export const ProcurementTable: React.FC<ProcurementTableProps> = ({ currentProjectId, currentProjectName, userRole, onLogout, onBackToHome }) => {

  const [allRows, setAllRows] = useState<ProcurementRow[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Migrate old data if needed or just replace properties
          return parsed.map((r: any) => ({
            ...r,
            remarks: r.remarks || '',
            projectId: r.projectId || 'default-project',
            // Ensure new fields exist
            procurementSignOffDate: r.procurementSignOffDate || '',
            controlledDuration: r.controlledDuration || ''
          }));
        } catch (e) {
          console.error("Failed to parse saved data", e);
        }
      }
    }
    return INITIAL_ROWS;
  });

  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    rowId: string | null;
    field: keyof ProcurementRow | null;
    currentDate: string;
  }>({ isOpen: false, rowId: null, field: null, currentDate: '' });

  const displayRows = allRows.filter(r => r.projectId === currentProjectId);

  const totalItems = displayRows.length;
  // Example metric: Completed if contractor confirmed
  const completedItems = displayRows.filter(r => r.contractorConfirmDate).length;

  // Calculate delay metrics for dashboard (simple count of red lights in request variance)
  const delayedItems = displayRows.filter(r => {
    const variance = calculateVariance(r.scheduledRequestDate, r.actualRequestDate);
    return variance !== null && variance < -30;
  }).length;

  const upcomingItems = displayRows.filter(r => {
    if (!r.scheduledRequestDate || r.actualRequestDate) return false;
    const date = new Date(r.scheduledRequestDate);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return date >= today && date <= nextWeek;
  }).length;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
  }, [allRows]);

  const isEditable = (field: keyof ProcurementRow): boolean => {
    if (field === 'projectName') return false;
    if (userRole === 'ADMIN') return true;

    switch (userRole) {
      case 'PLANNER':
        return ['engineeringItem', 'scheduledRequestDate', 'siteOrganizer'].includes(field);
      case 'EXECUTOR':
        return ['actualRequestDate', 'remarks'].includes(field);
      case 'PROCUREMENT':
        return ['procurementOrganizer', 'procurementSignOffDate', 'controlledDuration', 'contractorConfirmDate', 'contractorName', 'remarks'].includes(field);
      default: return false;
    }
  };

  const canManageRows = userRole === 'ADMIN' || userRole === 'PLANNER';

  const addRow = () => {
    if (!canManageRows) return;
    const newRow: ProcurementRow = {
      id: crypto.randomUUID(),
      projectId: currentProjectId,
      remarks: '',
      projectName: currentProjectName,
      engineeringItem: '',
      scheduledRequestDate: '',
      actualRequestDate: '',
      siteOrganizer: '',
      procurementOrganizer: '',
      procurementSignOffDate: '',
      controlledDuration: '',
      contractorConfirmDate: '',
      contractorName: ''
    };
    setAllRows([...allRows, newRow]);
  };

  const deleteRow = (id: string) => {
    if (!canManageRows) return;
    setAllRows(allRows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof ProcurementRow, value: string) => {
    if (!isEditable(field)) return;
    setAllRows(prevRows => prevRows.map(row => {
      if (row.id === id) return { ...row, [field]: value };
      return row;
    }));
  };

  const exportCSV = () => {
    const headers = [
      "工程項目",
      "預定提出時間", "實際提出時間",
      "工地主辦", "採購主辦",
      "採購承辦簽出日期", "列控採購作業時間",
      "確認承攬商日期", "廠商",
      "請購時程差異", "請購差異狀態",
      "備註",
      "採購時程差異", "採購差異狀態"
    ];

    const csvContent = [
      headers.join(','),
      ...displayRows.map(row => {
        // Request Variance
        const reqVariance = calculateVariance(row.scheduledRequestDate, row.actualRequestDate);
        let reqStatus = "正常";
        let reqDelay = 0;
        if (reqVariance !== null && reqVariance < 0) {
          reqDelay = Math.abs(reqVariance);
          if (reqDelay > 30) reqStatus = "嚴重延誤 (紅燈)";
          else if (reqDelay >= 8) reqStatus = "延誤需通知 (橘燈)";
          else reqStatus = "警示 (黃燈)";
        }

        // Procurement Variance
        let procStatus = "-";
        let procDelay = 0;
        let procVarianceDisplay = "";

        if (row.actualRequestDate && row.procurementSignOffDate && row.controlledDuration) {
          const actualDuration = calculateDuration(row.actualRequestDate, row.procurementSignOffDate);
          const controlledDuration = parseInt(row.controlledDuration) || 0;

          if (actualDuration !== null) {
            const variance = controlledDuration - actualDuration;
            procVarianceDisplay = variance.toString();
            if (variance < 0) {
              procDelay = Math.abs(variance);
              if (procDelay > 30) procStatus = "嚴重延誤 (紅燈)";
              else if (procDelay >= 8) procStatus = "延誤需通知 (橘燈)";
              else procStatus = "正常";
              if (procDelay > 0 && procDelay < 8) procStatus = "正常 (微延誤)";
            } else {
              procStatus = "正常";
            }
          }
        }

        return [
          row.engineeringItem,
          row.scheduledRequestDate,
          row.actualRequestDate,
          row.siteOrganizer,
          row.procurementOrganizer,
          row.procurementSignOffDate,
          row.controlledDuration,
          row.contractorConfirmDate,
          row.contractorName,
          reqVariance ?? '',
          reqStatus,
          row.remarks,
          procVarianceDisplay,
          procStatus
        ].map(val => `"${val}"`).join(',');
      })
    ].join('\n');

    const dateStr = new Date().toISOString().split('T')[0];
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${currentProjectName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getInputClass = (field: keyof ProcurementRow) => {
    const editable = isEditable(field);
    const base = "w-full rounded outline-none transition-all border-b border-transparent text-sm py-1 px-2";
    if (editable) {
      return `${base} hover:border-slate-300 focus:border-blue-500`;
    }
    return `${base} cursor-not-allowed select-none text-slate-500`;
  };

  const handleOpenPicker = (rowId: string, field: keyof ProcurementRow, currentDate: string) => {
    setPickerState({ isOpen: true, rowId, field, currentDate });
  };

  const handleDateSelect = (dateStr: string) => {
    if (pickerState.rowId && pickerState.field) {
      updateRow(pickerState.rowId, pickerState.field, dateStr);
      setPickerState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Helper for Request Variance Light
  const RequestVarianceLight = ({ variance }: { variance: number | null }) => {
    if (variance === null) return <span className="text-gray-300">-</span>;
    // Variance = S - A. If < 0, Delay.
    const delay = variance < 0 ? Math.abs(variance) : 0;

    let color = "bg-green-500"; // < 8 delay
    if (delay > 30) color = "bg-red-600";
    else if (delay >= 8) color = "bg-yellow-400";

    return (
      <div className="flex items-center justify-center gap-2">
        <span className={variance < 0 ? "text-red-600 font-bold" : "text-slate-600"}>{Math.abs(variance)}</span>
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
      </div>
    );
  };

  // Helper for Procurement Variance Light
  const ProcurementVarianceLight = ({ row }: { row: ProcurementRow }) => {
    if (!row.actualRequestDate || !row.procurementSignOffDate || !row.controlledDuration) return <span className="text-gray-300">-</span>;
    const actualDuration = calculateDuration(row.actualRequestDate, row.procurementSignOffDate);
    if (actualDuration === null) return <span className="text-gray-300">-</span>;

    const controlled = parseInt(row.controlledDuration) || 0;
    const variance = controlled - actualDuration; // Positive is good (under time), Negative is bad (over time)

    const delay = variance < 0 ? Math.abs(variance) : 0;

    // Logic: Delay > 30 (Red), 8-30 (Yellow), Else Green.
    let color = "bg-green-500";
    if (delay > 30) color = "bg-red-600";
    else if (delay >= 8) color = "bg-yellow-400";

    return (
      <div className="flex items-center justify-center gap-2">
        <span className={variance < 0 ? "text-red-600 font-bold" : "text-slate-600"}>{Math.abs(variance)}</span>
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
      <CustomDatePicker
        isOpen={pickerState.isOpen}
        initialDate={pickerState.currentDate}
        onSelect={handleDateSelect}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="bg-white border-b border-slate-200">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">請採購項目管理表</h2>
              <p className="text-sm text-slate-500">進度追蹤與時程控管</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageRows && (
              <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium">
                <Plus size={16} /> 新增
              </button>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium">
              <Download size={16} /> 匯出
            </button>
          </div>
        </div>

        {/* Summary Dashboard */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">總項目</p>
                <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-blue-500">
                <Layers size={20} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">嚴重延誤</p>
                <p className={`text-2xl font-bold ${delayedItems > 0 ? 'text-red-600' : 'text-slate-700'}`}>{delayedItems}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-red-500">
                <AlertCircle size={20} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">本週即將到期</p>
                <p className="text-2xl font-bold text-amber-600">{upcomingItems}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-amber-500">
                <Clock size={20} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">已發包</p>
                <p className="text-2xl font-bold text-green-600">{completedItems}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-green-500">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 shadow-sm bg-slate-50/90 backdrop-blur-sm">
            <tr>
              <th className="bg-slate-50 p-3 text-center text-slate-400 font-semibold w-[50px] border-b border-slate-200"></th>
              <th className="bg-slate-50 p-3 text-left font-bold text-slate-700 border-b border-slate-200 min-w-[180px]">工程項目</th>

              {/* Group 2: Request Date */}
              <th className="bg-blue-50/50 p-3 text-center font-bold text-blue-900 border-b border-blue-100 border-l border-blue-100" colSpan={2}>提出請購時程</th>

              {/* Group 3, 4: Organizers */}
              <th className="bg-slate-50 p-3 text-center font-bold text-slate-700 border-b border-slate-200 border-l border-slate-200">工地主辦</th>
              <th className="bg-slate-50 p-3 text-center font-bold text-slate-700 border-b border-slate-200 border-l border-slate-200">採購承辦</th>

              {/* Group 5: Sign Off */}
              <th className="bg-slate-50 p-3 text-center font-bold text-slate-700 border-b border-slate-200 border-l border-slate-200">採購簽出</th>

              {/* Group 6: Controlled Duration */}
              <th className="bg-slate-50 p-3 text-center font-bold text-slate-700 border-b border-slate-200 border-l border-slate-200">列控時間</th>

              {/* Group 7: Contractor */}
              <th className="bg-slate-50 p-3 text-center font-bold text-slate-700 border-b border-slate-200 border-l border-slate-200" colSpan={2}>確認承攬廠商日期</th>

              {/* Group 8: Request Variance */}
              <th className="bg-yellow-50/50 p-3 text-center font-bold text-yellow-900 border-b border-yellow-100 border-l border-yellow-100">請購差異</th>

              {/* Group 9: Remarks */}
              <th className="bg-slate-50 p-3 text-left font-bold text-slate-700 border-b border-slate-200 min-w-[200px] border-l border-slate-200">備註說明<span className="text-xs font-normal text-slate-500 block">(超過天數&工地說明)</span></th>

              {/* Group 10: Procurement Variance */}
              <th className="bg-yellow-50/50 p-3 text-center font-bold text-yellow-900 border-b border-yellow-100 border-l border-yellow-100">採購差異</th>
            </tr>
            <tr className="text-xs text-slate-500 font-medium">
              <th className="bg-slate-50 p-2 border-b border-slate-200"></th>
              <th className="bg-slate-50 p-2 text-left border-b border-slate-200"></th>

              <th className="bg-blue-50/50 p-2 text-center text-blue-800 border-b border-blue-100 border-l border-blue-100 min-w-[110px]">預定</th>
              <th className="bg-blue-50/50 p-2 text-center text-blue-800 border-b border-blue-100 min-w-[110px]">實際</th>

              <th className="bg-slate-50 p-2 text-center border-b border-slate-200 border-l border-slate-200 w-[4.5rem] min-w-[4.5rem]"></th>
              <th className="bg-slate-50 p-2 text-center border-b border-slate-200 w-[4.5rem] min-w-[4.5rem]"></th>

              <th className="bg-slate-50 p-2 text-center border-b border-slate-200 border-l border-slate-200 min-w-[110px]">日期</th>
              <th className="bg-slate-50 p-2 text-center border-b border-slate-200 w-[4rem]">天數</th>

              <th className="bg-slate-50 p-2 text-center border-b border-slate-200 border-l border-slate-200 min-w-[110px]">日期</th>
              <th className="bg-slate-50 p-2 text-center border-b border-slate-200">廠商</th>

              <th className="bg-yellow-50/50 p-2 text-center text-yellow-800 border-b border-yellow-100 border-l border-yellow-100">天數/狀態</th>

              <th className="bg-slate-50 p-2 text-left border-b border-slate-200 border-l border-slate-200"></th>

              <th className="bg-yellow-50/50 p-2 text-center text-yellow-800 border-b border-yellow-100 border-l border-yellow-100">天數/狀態</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayRows.map((row) => {
              return (
                <tr key={row.id} className="hover:bg-blue-50/30 group transition-colors">
                  {/* Op */}
                  <td className="py-2 px-2 text-center border-b border-slate-100">
                    <button
                      onClick={() => deleteRow(row.id)}
                      disabled={!canManageRows}
                      className={`p-1.5 rounded-lg transition-colors ${canManageRows ? 'text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer' : 'text-transparent cursor-not-allowed'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>

                  {/* 1. Engineering Item */}
                  <td className="py-2 px-2 border-b border-slate-100 align-middle">
                    <BufferedInput value={row.engineeringItem} disabled={!isEditable('engineeringItem')} onCommit={(val) => updateRow(row.id, 'engineeringItem', val)} className={getInputClass('engineeringItem') + " font-bold text-slate-800"} placeholder="輸入工程項目" />
                  </td>

                  {/* 2. Scheduled/Actual Request Date */}
                  <td className="py-2 px-2 border-b border-slate-100 border-l border-slate-50 align-middle bg-blue-50/10">
                    <DateInput value={row.scheduledRequestDate} disabled={!isEditable('scheduledRequestDate')} onChange={(val) => updateRow(row.id, 'scheduledRequestDate', val)} className={getInputClass('scheduledRequestDate')} onOpenPicker={() => handleOpenPicker(row.id, 'scheduledRequestDate', row.scheduledRequestDate)} />
                  </td>
                  <td className="py-2 px-2 border-b border-slate-100 align-middle bg-blue-50/10">
                    <DateInput value={row.actualRequestDate} disabled={!isEditable('actualRequestDate')} onChange={(val) => updateRow(row.id, 'actualRequestDate', val)} className={getInputClass('actualRequestDate')} onOpenPicker={() => handleOpenPicker(row.id, 'actualRequestDate', row.actualRequestDate)} />
                  </td>

                  {/* 3. Site Organizer */}
                  <td className="py-2 px-2 align-middle w-[4.5rem] min-w-[4.5rem] border-b border-slate-100 border-l border-slate-50">
                    <BufferedInput value={row.siteOrganizer} disabled={!isEditable('siteOrganizer')} onCommit={(val) => updateRow(row.id, 'siteOrganizer', val)} className={getInputClass('siteOrganizer') + " text-center"} />
                  </td>

                  {/* 4. Procurement Organizer */}
                  <td className="py-2 px-2 border-b border-slate-100 align-middle w-[4.5rem] min-w-[4.5rem]">
                    <BufferedInput value={row.procurementOrganizer} disabled={!isEditable('procurementOrganizer')} onCommit={(val) => updateRow(row.id, 'procurementOrganizer', val)} className={getInputClass('procurementOrganizer') + " text-center"} />
                  </td>

                  {/* 5. Procurement SignOff Date */}
                  <td className="py-2 px-2 border-b border-slate-100 border-l border-slate-50 align-middle">
                    <DateInput value={row.procurementSignOffDate} disabled={!isEditable('procurementSignOffDate')} onChange={(val) => updateRow(row.id, 'procurementSignOffDate', val)} className={getInputClass('procurementSignOffDate')} onOpenPicker={() => handleOpenPicker(row.id, 'procurementSignOffDate', row.procurementSignOffDate)} />
                  </td>

                  {/* 6. Controlled Duration */}
                  <td className="py-2 px-2 border-b border-slate-100 border-l border-slate-50 align-middle">
                    <BufferedInput value={row.controlledDuration} disabled={!isEditable('controlledDuration')} onCommit={(val) => updateRow(row.id, 'controlledDuration', val)} className={getInputClass('controlledDuration') + " text-center"} placeholder="天數" />
                  </td>

                  {/* 7. Contractor Confirm (Date/Name) */}
                  <td className="py-2 px-2 border-b border-slate-100 border-l border-slate-50 align-middle">
                    <DateInput value={row.contractorConfirmDate} disabled={!isEditable('contractorConfirmDate')} onChange={(val) => updateRow(row.id, 'contractorConfirmDate', val)} className={getInputClass('contractorConfirmDate')} onOpenPicker={() => handleOpenPicker(row.id, 'contractorConfirmDate', row.contractorConfirmDate)} />
                  </td>
                  <td className="py-2 px-2 border-b border-slate-100 align-middle">
                    <BufferedInput value={row.contractorName} disabled={!isEditable('contractorName')} onCommit={(val) => updateRow(row.id, 'contractorName', val)} className={getInputClass('contractorName') + " text-center"} />
                  </td>

                  {/* 8. Request Variance */}
                  <td className="py-2 px-2 text-center border-b border-slate-100 border-l border-slate-50 bg-yellow-50/10">
                    <RequestVarianceLight variance={calculateVariance(row.scheduledRequestDate, row.actualRequestDate)} />
                  </td>

                  {/* 9. Remarks */}
                  <td className="py-2 px-2 align-middle border-b border-slate-100 border-l border-slate-50">
                    <BufferedInput value={row.remarks} disabled={!isEditable('remarks')} onCommit={(val) => updateRow(row.id, 'remarks', val)} className={getInputClass('remarks')} placeholder="..." />
                  </td>

                  {/* 10. Procurement Variance */}
                  <td className="py-2 px-2 text-center border-b border-slate-100 border-l border-slate-50 bg-yellow-50/10">
                    <ProcurementVarianceLight row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
              <Layers size={32} />
            </div>
            <p>本專案目前無資料</p>
            <button onClick={addRow} className="mt-4 text-blue-600 font-medium hover:underline">新增第一筆資料</button>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Lock size={12} />
          <span>權限: {ROLE_DESCRIPTIONS[userRole]}</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> 正常/延誤&lt;8天</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> 延誤 8-30天</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-full"></div> 嚴重 &gt;30天</span>
        </div>
      </div>
    </div>
  );
};