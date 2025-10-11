"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Search, CircleDot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Atividades",
  "Projetos", 
  "Empresas",
  "Contatos",
  "Funcionários",
  "Produtos",
  "Inventário",
  "Relatórios",
  "Configurações",
  "WhatsApp",
  "AI Agent"
]

interface TopBarSearchProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showHistory?: boolean
}

const TopBarSearch = ({ placeholder = "Buscar...", onSearch, showHistory = true }: TopBarSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value.trim() && showHistory) {
      const filtered = SUGGESTIONS.filter((item) => 
        item.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }
  }

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  const searchIconVariants = {
    initial: { scale: 1 },
    animate: {
      rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : 0,
      scale: isAnimating ? [1, 1.2, 1] : 1,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
  }

  const suggestionVariants = {
    hidden: (i: number) => ({
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, delay: i * 0.05 },
    }),
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 15, delay: i * 0.07 },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -5,
      scale: 0.9,
      transition: { duration: 0.1, delay: i * 0.03 },
    }),
  }

  return (
    <div className="relative w-full">
      <motion.form
        onSubmit={handleSubmit}
        className="relative flex items-center justify-center w-full"
        initial={{ scale: 1 }}
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
         <motion.div
           className={cn(
             "flex items-center w-full rounded-lg border-0 relative overflow-hidden transition-all duration-200",
             isFocused 
               ? "bg-white/10 shadow-lg" 
               : "bg-white/10 hover:bg-white/15"
           )}
           animate={{
             boxShadow: isFocused
               ? "0 4px 20px rgba(255, 255, 255, 0.1)"
               : "none",
           }}
        >
           <motion.div 
             className="pl-3 pr-2 py-1.5" 
             variants={searchIconVariants} 
             initial="initial" 
             animate="animate"
           >
             <Search
               size={14}
               strokeWidth={isFocused ? 2.5 : 2}
               className={cn(
                 "transition-all duration-300",
                 isAnimating 
                   ? "text-white" 
                   : isFocused 
                     ? "text-white" 
                     : "text-white/80"
               )}
            />
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
             className={cn(
               "w-full py-1.5 pr-2.5 bg-transparent outline-none placeholder:text-white/60 font-medium text-xs relative z-10",
               isFocused ? "text-white tracking-wide" : "text-white/90"
             )}
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                whileHover={{
                  scale: 1.05,
                  background: "linear-gradient(45deg, #4A5477 0%, #3F30F1 100%)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 mr-2 text-xs font-medium rounded-md text-white backdrop-blur-sm transition-all shadow-sm"
                style={{ background: 'linear-gradient(45deg, #4A5477 0%, #3F30F1 100%)' }}
              >
                Buscar
              </motion.button>
            )}
          </AnimatePresence>

          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.05, 0.1, 0.05, 0],
                background: "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            />
          )}
        </motion.div>
      </motion.form>

      <AnimatePresence>
        {isFocused && showHistory && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
               className="absolute z-50 w-full mt-2 overflow-hidden bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20"
            style={{
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  custom={index}
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => {
                    setSearchQuery(suggestion)
                    if (onSearch) onSearch(suggestion)
                    setIsFocused(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md hover:bg-purple-50 group transition-colors"
                >
                  <motion.div 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    transition={{ delay: index * 0.06 }}
                  >
                    <CircleDot size={12} className="text-purple-400 group-hover:text-purple-600" />
                  </motion.div>
                  <motion.span
                    className="text-sm text-gray-700 group-hover:text-purple-700"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {suggestion}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { TopBarSearch }
