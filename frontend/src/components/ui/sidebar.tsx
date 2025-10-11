"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  Blocks,
  ChevronsUpDown,
  FileClock,
  GraduationCap,
  Layout,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  MessagesSquare,
  Plus,
  Settings,
  UserCircle,
  UserCog,
  UserSearch,
  Home,
  BarChart3,
  ShoppingCart,
  FileSpreadsheet,
  Calendar,
  CheckSquare,
  DollarSign,
  Activity,
  Users,
  Building2,
  Package,
  Target,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  FileText,
  FolderOpen,
  Users2,
  Handshake,
  TrendingUp,
  PanelLeft,
  Bell,
  BellOff,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: {
    id: string;
    title: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const location = useLocation();
  
  // Detect if dark mode is active (you can implement your own dark mode detection)
  const isDarkMode = false; // This should be connected to your theme system

  const menuGroups: MenuGroup[] = [
    {
      id: "crm",
      title: "CRM",
      icon: <TrendingUp className="h-6 w-6" />,
      items: [
        {
          id: "companies",
          title: "Empresas",
          path: "/companies",
          icon: <Building2 className="h-5 w-5" />
        },
        {
          id: "inventory",
          title: "Inventário",
          path: "/inventory",
          icon: <Package className="h-5 w-5" />
        },
        {
          id: "leads",
          title: "Leads",
          path: "/leads-sales",
          icon: <UserSearch className="h-5 w-5" />
        }
      ]
    },
    {
      id: "collaboration",
      title: "Colaboração",
      icon: <Handshake className="h-6 w-6" />,
      items: [

        {
          id: "feed",
          title: "Feed",
          path: "/feed",
          icon: <MessageSquareText className="h-5 w-5" />
        },
        {
          id: "workgroups",
          title: "Grupo de Trabalho",
          path: "/work-groups",
          icon: <Users2 className="h-5 w-5" />
        },

        {
          id: "calendar",
          title: "Calendário",
          path: "/calendar",
          icon: <Calendar className="h-5 w-5" />
        }
      ]
    },
    {
      id: "management",
      title: "Gestão",
      icon: <Briefcase className="h-6 w-6" />,
      items: [
        {
          id: "activities",
          title: "Atividades",
          path: "/activities",
          icon: <Activity className="h-5 w-5" />
        },
        {
          id: "projects",
          title: "Projetos",
          path: "/projects",
          icon: <Target className="h-5 w-5" />
        },
        {
          id: "employees",
          title: "Funcionários",
          path: "/employees",
          icon: <Users className="h-5 w-5" />
        }
      ]
    }
  ];

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupExpanded = (groupId: string) => expandedGroups.includes(groupId);
  const isActiveItem = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r fixed",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            {/* Header com Logo e Botão de Toggle */}
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="flex w-full items-center justify-between">
                {/* Logo */}
                <div className="flex items-center justify-center w-12 h-12">
                  <img 
                    src={isDarkMode ? "/logo-dark.png" : "/logo-light.png"} 
                    alt="Logo" 
                    className={cn(
                      "transition-all duration-200",
                      isCollapsed ? "h-8 w-8" : "h-10 w-auto"
                    )}
                  />
                </div>
                
                {/* Botão de Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {/* Home */}
                    <Link
                      to="/"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        location.pathname === "/" && "bg-muted text-blue-600",
                      )}
                    >
                      <Home className="h-6 w-6" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Home</p>
                        )}
                      </motion.li>
                    </Link>

                    {/* Menu Groups */}
                    {menuGroups.map((group) => (
                      <div key={group.id} className="space-y-1">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className={cn(
                            "flex h-10 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            isGroupExpanded(group.id) && "bg-muted text-blue-600",
                          )}
                        >
                          {group.icon}
                          <motion.div variants={variants} className="flex items-center justify-between w-full">
                            {!isCollapsed && (
                              <>
                                <p className="ml-2 text-sm font-medium">{group.title}</p>
                                {isGroupExpanded(group.id) ? (
                                  <ChevronDown className="h-5 w-5 ml-auto" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 ml-auto" />
                                )}
                              </>
                            )}
                          </motion.div>
                        </button>

                        {/* Group Items */}
                        {isGroupExpanded(group.id) && !isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-4 space-y-1"
                          >
                            {group.items.map((item) => (
                              <Link
                                key={item.id}
                                to={item.path}
                                className={cn(
                                  "flex h-7 w-full flex-row items-center rounded-md px-2 py-1.5 text-sm transition hover:bg-muted hover:text-primary",
                                  isActiveItem(item.path) && "bg-muted text-blue-600",
                                )}
                              >
                                {item.icon}
                                <span className="ml-2 text-sm">{item.title}</span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    ))}

                    <Separator className="w-full" />

                    {/* Reports */}
                    <Link
                      to="/reports"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        location.pathname?.includes("reports") && "bg-muted text-blue-600",
                      )}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Relatórios</p>
                        )}
                      </motion.li>
                    </Link>

                    <Separator className="w-full" />

                    {/* Settings */}
                    <Link
                      to="/settings"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        location.pathname?.includes("settings") && "bg-muted text-blue-600",
                      )}
                    >
                      <Settings className="h-6 w-6" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Configurações</p>
                        )}
                      </motion.li>
                    </Link>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2">
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            A
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium">Conta</p>
                              <ChevronsUpDown className="ml-auto h-5 w-5 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>
                            AL
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {`Administrador`}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {`admin@vbsolution.com`}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2"
                      >
                        <Link to="/settings/profile">
                          <UserCircle className="h-4 w-4" /> Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
