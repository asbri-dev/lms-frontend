// src/shared/config/moduleConfig.js
import { GraduationCap,Leaf,Snowflake,Sun } from 'lucide-react';

export const moduleConfig = {
  SUPERADMIN: {
    title: "Management",
    subtitle: "Leave Management System",

    theme: {
      sidebar: "bg-slate-900",
      background: "bg-[#2b3c6b]",
      Ntext: "text-white",
      hover: "hover:bg-[#3f548f]",
      active : "bg-white",
      text: "text-slate-900",
      header: "bg-white",
    },

    label: "Super Admin",
  },

  ADMIN: {
    title: "Faculty Sphere",
    subtitle: "Leave Management System",

    theme: {
      sidebar: "bg-slate-900",
      background: "bg-[#2b3c6b]",
      Ntext: "text-white",
      hover: "hover:bg-[#3f548f]",
      active : "bg-white",
      text: "text-slate-900",
      header: "bg-white",
    },

    label: "Admin",
  },

  HEAD: {
    title: "Faculty Sphere",
    subtitle: "Leave Management System",

    theme: {
      sidebar: "bg-slate-900",
      background: "bg-[#2b3c6b]",
      Ntext: "text-white",
      hover: "hover:bg-[#3f548f]",
      active : "bg-[#3f548f]",
      header: "bg-white",
    },

    label: "Head",
  },

  FACULTY: {
    title: "Faculty Sphere",
    subtitle: "Leave Management System",

    theme: {
      sidebar: "bg-slate-900",
      background: "bg-[#2b3c6b]",
      Ntext: "text-white",
      hover: "hover:bg-[#3f548f]",
      active : "bg-white",
      text: "text-slate-900",
      header: "bg-white",
    },

    label: "Faculty",
  },

  FHADMIN: {
    title: "Finance Portal",
    subtitle: "Fee & Payment Management",
    icon: Sun,
    background:"bg-[#ea580c] p-2 rounded-md shadow-lg",

    theme: {
      sidebar: "bg-black",
      background: "bg-white",
      hover: "hover:bg-[#0e273c]",
      active : "bg-[#fef3c7]",
      text: "text-[#ea580c]",
      header: "bg-white",
    },

    label: "Finance Head",
  },

  FADMIN: {
    title: "Finance Portal",
    subtitle: "Fee & Payment Management",
    icon: Leaf,
    background:"bg-green-500 p-2 rounded-md shadow-lg",

    theme: {
      sidebar: "bg-black",
      background: "bg-white",
      hover: "hover:bg-[#dcfce7]",
      active : "bg-[#dcfce7]",
      text: "text-[#16a34a]",
      header: "bg-white",
    },

    label: "Finance Admin",
  },

  STUDENT: {
    title: "Finance Portal",
    subtitle: "Fees",
    icon: Snowflake,
    background:"bg-blue-500 p-2 rounded-md shadow-lg",

    theme: {
      sidebar: "bg-black",
      background: "bg-white",
      Ntext: "text-black",
      hover: "hover:bg-[#d8e4fa]",
      active : "bg-[#d8e4fa]",
      text: "text-[#3d7dfc]",
      header: "bg-white",  
    },

    label: "Student",
  },
};