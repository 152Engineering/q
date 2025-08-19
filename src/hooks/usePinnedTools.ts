import { useState, useEffect } from 'react';

export interface Tool {
  title: string;
  description: string;
  icon: string;
  path?: string;
  action?: () => void;
}

export const tools: Tool[] = [
  {
    title: "E6B Flight Computer",
    description: "Digital flight computer for calculations",
    icon: "fa-calculator",
    path: "/app/tools/e6b"
  },
  {
    title: "PDF Viewer",
    description: "View and annotate aviation documents",
    icon: "fa-file-alt",
    path: "/app/tools/pdf-viewer"
  },
  {
    title: "ScratchPad",
    description: "Quick notes and calculations",
    icon: "fa-edit",
    path: "/app/tools/scratchpad"
  },
  {
    title: "Checklists",
    description: "Aircraft checklists and procedures",
    icon: "fa-check-square",
    path: "/app/tools/checklists"
  },
  {
    title: "Data Import / Export",
    description: "Import and export flight data",
    icon: "fa-upload",
    path: "/app/tools/data-import-export"
  },
  {
    title: "Reports",
    description: "Flight reports and analytics",
    icon: "fa-chart-bar",
    path: "/app/tools/reports"
  },
  {
    title: "Licenses, Ratings & Endorsements",
    description: "Manage licenses and certifications",
    icon: "fa-certificate",
    path: "/app/tools/licenses-ratings-endorsements"
  },
  {
    title: "Instructor / Examiner Sign-Offs",
    description: "Track instructor and examiner sign-offs",
    icon: "fa-clipboard-check",
    path: "/app/tools/flight-tests-exams"
  },
  {
    title: "Aircraft Maintenance",
    description: "Track aircraft maintenance and inspections",
    icon: "fa-wrench",
    path: "/app/tools/aircraft-maintenance"
  },
  {
    title: "Syndicate Calendar",
    description: "Manage aircraft bookings and schedules",
    icon: "fa-calendar",
    path: "/app/tools/syndicate-calendar"
  },
  {
    title: "Budgets",
    description: "Flight cost tracking and budgeting",
    icon: "fa-dollar-sign",
    path: "/app/tools/budgets"
  },
  {
    title: "IFR Clearances",
    description: "IFR clearance tracking and management",
    icon: "fa-tower-broadcast",
    path: "/app/tools/ifr-clearances"
  }
];

export const usePinnedTools = () => {
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);

  useEffect(() => {
    // Load pinned tools from localStorage
    const loadPinnedTools = () => {
      const savedPinnedTools = localStorage.getItem('pinnedTools');
      if (savedPinnedTools) {
        setPinnedTools(JSON.parse(savedPinnedTools));
      }
    };

    loadPinnedTools();

    // Listen for localStorage changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pinnedTools') {
        loadPinnedTools();
      }
    };

    // Listen for custom events for same-window updates
    const handleCustomStorageChange = () => {
      loadPinnedTools();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pinnedToolsChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pinnedToolsChanged', handleCustomStorageChange);
    };
  }, []);

  const togglePin = (toolTitle: string) => {
    const isCurrentlyPinned = pinnedTools.includes(toolTitle);
    let newPinnedTools: string[];
    
    if (isCurrentlyPinned) {
      newPinnedTools = pinnedTools.filter(t => t !== toolTitle);
    } else {
      if (pinnedTools.length >= 2) {
        return { success: false, message: "Maximum pins reached" };
      }
      newPinnedTools = [...pinnedTools, toolTitle];
    }
    
    setPinnedTools(newPinnedTools);
    localStorage.setItem('pinnedTools', JSON.stringify(newPinnedTools));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('pinnedToolsChanged'));
    
    return { success: true, isPinned: !isCurrentlyPinned };
  };

  const getPinnedToolsData = () => {
    return pinnedTools
      .map(title => tools.find(tool => tool.title === title))
      .filter(Boolean) as Tool[];
  };

  return {
    pinnedTools,
    togglePin,
    getPinnedToolsData
  };
};