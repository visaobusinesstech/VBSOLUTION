import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image, 
  Video, 
  Mic, 
  MapPin, 
  Paperclip,
  Smile,
  X,
  Loader2,
  Sparkles,
  CheckCircle,
  Wand2,
  Languages,
  FileText,
  List,
  Star,
  MessageSquare,
  Plus
} from 'lucide-react';
import { log } from '@/utils/productionLogger';

const VERBOSE_AUDIO = Boolean(import.meta.env?.VITE_DEBUG_AUDIO);
const audioLog = {
  debug: (...a: any[]) => { if (VERBOSE_AUDIO) log.debug('[AUDIO]', ...a); },
  error: (...a: any[]) => log.error('[AUDIO]', ...a),
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConnections } from '@/contexts/ConnectionsContext';
import { useAIAgentConfig } from '@/hooks/useAIAgentConfig';
import { useConversationDrafts } from '@/hooks/useConversationDrafts';
import { AudioRecorder } from '@/components/AudioRecorder';
import { toast } from 'sonner';

interface WhatsAppOptimizedComposerProps {
  jid: string;
  onMessageSent?: (message: any) => void;
  className?: string;
  onNoteAdded?: (note: string) => void;
  onDraftChange?: (jid: string, draft: string) => void;
}

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (text: string) => Promise<string>;
}

export const WhatsAppOptimizedComposer: React.FC<WhatsAppOptimizedComposerProps> = ({
  jid,
  onMessageSent,
  className = '',
  onNoteAdded,
  onDraftChange
}) => {
  const { activeConnection } = useConnections();
  const { activeConfig } = useAIAgentConfig();
  const { getDraft, setDraft, clearDraft } = useConversationDrafts();
  
  // Estados principais
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  // Estados do AI
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Estados do Emoji
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Pessoas');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);

  // Categorias de emojis
  const emojiCategories = {
    'Pessoas': ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🫠', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '🥺', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😵‍💫', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥴', '😇', '🥳', '🥸', '🤠', '🤡', '🤥', '🤫', '🤭', '🫢', '🫣', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '☠️', '👻', '👽', '👾', '🤖', '🎃'],
    'Animais & Natureza': ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐕‍🦺', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🫎', '🫏', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🪽', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠'],
    'Comidas e Bebidas': ['💐', '🌸', '💮', '🪷', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🪻', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🫘', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🫗', '🥤', '🧋', '🧃', '🧉', '🧊'],
    'Viagens e Lugares': ['🥢', '🍽️', '🍴', '🥄', '🔪', '🫙', '🏺', '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '🕋', '⛩️', '🛤️', '🛣️', '🗿', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚠', '🚡', '🚟', '🚃', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝', '⛽', '🚧', '🚏', '🚦', '🚥', '🛑', '🚨', '🚒', '🛻', '🚚', '🚛', '🚜', '🛞', '🛟', '🛝', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗'],
    'Atividades e Eventos': ['🏆', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '🪀', '🪁', '🎱', '🎖️', '🏅', '🎗️', '🥁', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '📯', '🥁', '🎬', '🎨', '🧵', '🪡', '🧶', '🪢', '🧩', '♟️', '🎯', '🎮', '🎰', '🧩', '🪅', '🪆', '🧸', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🎨', '🎪', '🎟️', '🎫', '🩰', '🎖️', '🏆', '🥇', '🥈', '🥉', '🎗️'],
    'Objetos': ['🔮', '🪄', '🧿', '🪬', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩻', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📮', '📪', '📫', '📬', '📭', '📦', '📯', '📥', '📤', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '✂️', '🖊️', '🖋️', '✒️', '📝', '✏️', '🖍️', '🖌️', '🖊️', '🖋️', '🖊️', '📊', '📈', '📉', '📌', '📍', '🧭', '🧮', '📊', '📡', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔭', '🔬', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '🧾', '💎', '⚖️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🪛', '🔗', '🧰', '🪝', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '🩺', '🩻', '🚪', '🪞', '🛏️', '🛋️', '🚽', '🚿', '🛁', '🧴', '🧼', '🧽', '🧹', '🪠', '🧺', '🪤', '🪒', '🔑', '🗝️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '📦', '📯', '📥', '📤', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🔗', '📎', '🖇️', '📐', '📏', '✂️', '✒️', '🖊️', '🖋️', '✏️', '🖍️', '🖌️', '📝'],
    'Símbolos': ['🔒', '🔓', '🔏', '🔐', '🗝️', '🔑', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🧰', '🔧', '🔩', '⚙️', '🪤', '🪛', '🧱', '🪨', '🪵', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '🩺', '🩻', '🧹', '🪠', '🧺', '🧻', '🚽', '🛁', '🛀', '🧼', '🪥', '🧽', '🧴', '🛎️', '🪑', '🛋️', '🛏️', '🖼️', '🪞', '🪟', '🧸', '🪆', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🧧', '✉️', '📦', '📯', '📥', '📤', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🔗', '📎', '🖇️', '📐', '📏', '✂️', '✒️', '🖊️', '🖋️', '✏️', '🖍️', '🖌️', '📝', '🖊️', '🖋️', '✒️', '🔒', '🔓', '🔏', '🔐', '🗝️', '🔑', '🪓', '⛏️', '⚒️', '🛠️', '🧰', '🔧', '🔩', '⚙️', '🪤', '🪛', '🧱', '🪨', '🪵', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '🩺', '🩻', '🧹', '🪠', '🧺', '🧻', '🛁', '🛀', '🧼', '🪥', '🧽', '🧴', '🛎️', '🛋️', '🛏️', '🖼️', '🪞', '🪟', '🧸', '🪆', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🧧']
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Verificar se IA está disponível - sempre disponível com configuração padrão
  const isAIAvailable = true; // Sempre disponível
  const effectiveConfig = activeConfig || {
    api_key: 'default-openai-key', // Chave padrão para desenvolvimento
    selected_model: 'gpt-4o-mini',
    is_connected: true,
    name: 'AI Assistant'
  };
  
  // Debug: Log da configuração (comentado para reduzir spam de logs)
  // audioLog.debug('🤖 WhatsAppOptimizedComposer - Configuração IA:', {
  //   hasConfig: !!activeConfig,
  //   hasApiKey: !!activeConfig?.api_key,
  //   apiKeyLength: activeConfig?.api_key?.length,
  //   isConnected: activeConfig?.is_connected,
  //   selectedModel: activeConfig?.selected_model,
  //   isAIAvailable,
  //   usingDefaultConfig: !activeConfig
  // });

  // Ações de IA
  const aiActions: AIAction[] = [
    {
      id: 'grammar',
      label: 'Corrigir Gramática',
      icon: <CheckCircle className="w-4 h-4" />,
      action: async (text: string) => {
        return await processAIAction('Corrija a gramática e ortografia do seguinte texto, mantendo exatamente o mesmo idioma da mensagem original. Mantenha o tom e estilo da mensagem:', text);
      }
    },
    {
      id: 'improve',
      label: 'Melhorar',
      icon: <Wand2 className="w-4 h-4" />,
      action: async (text: string) => {
        return await processAIAction('Melhore o seguinte texto tornando-o mais amigável e profissional, mas mantenha-o aproximadamente do mesmo tamanho. Adicione emojis quando apropriado para tornar a mensagem mais calorosa. Exemplo: "oi quanto custa um serviço?" deve virar "Olá! Gostaria de saber quanto custa o seu serviço! 😊":', text);
      }
    },
    {
      id: 'translate',
      label: 'Traduzir',
      icon: <Languages className="w-4 h-4" />,
      action: async (text: string) => {
        return await processAIAction('Traduza o seguinte texto para português brasileiro, mantendo o tom e contexto original:', text);
      }
    },
    {
      id: 'categorize',
      label: 'Categorizar',
      icon: <List className="w-4 h-4" />,
      action: async (text: string) => {
        return await processAIAction('Analise o seguinte texto e forneça: 1) Uma breve descrição do conteúdo principal, 2) Organize os tópicos importantes em categorias com bullet points. Mantenha o formato claro e profissional:', text);
      }
    },
    {
      id: 'summarize',
      label: 'Resumir',
      icon: <FileText className="w-4 h-4" />,
      action: async (text: string) => {
        return await processAIAction('Resuma o seguinte texto de forma concisa, mantendo o contexto e objetivo principal da mensagem. Não perca informações importantes:', text);
      }
    }
  ];

  // Processar ação de IA
  const processAIAction = async (prompt: string, text: string): Promise<string> => {
    audioLog.debug('🔧 processAIAction chamado:', { 
      prompt: prompt.substring(0, 100) + '...', 
      text: text.substring(0, 50) + '...', 
      isAIAvailable, 
      apiKey: activeConfig?.api_key ? 'Configurada' : 'Não configurada',
      model: activeConfig?.selected_model || 'gpt-4o-mini'
    });
    
    // IA sempre disponível
    audioLog.debug('✅ IA disponível para processamento');

    if (!text.trim()) {
      audioLog.debug('❌ Texto vazio');
      toast.error('Digite um texto para processar');
      return text;
    }

    try {
      audioLog.debug('📡 Enviando requisição para API de IA...');
      
      // Detectar se o texto original tem aspas para preservar o formato
      const hasQuotes = text.includes('"') || text.includes('"') || text.includes("'") || text.includes("'");
      const quoteInstruction = hasQuotes 
        ? 'Mantenha as aspas que já existem no texto original.' 
        : 'Não adicione aspas ao redor do resultado.';

      const requestBody = {
        prompt: `${prompt}\n\nTexto original: ${text}\n\nResponda APENAS com o texto processado, ${quoteInstruction} Sem explicações adicionais:`,
        model: effectiveConfig.selected_model || 'gpt-4o-mini',
        apiKey: effectiveConfig.api_key
      };
      
      audioLog.debug('📤 Request body:', { ...requestBody, apiKey: '***' + requestBody.apiKey?.slice(-4) });
      
      const response = await fetch(`${API_URL}/api/ai/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      audioLog.debug('📥 Response status:', response.status);
      const result = await response.json();
      audioLog.debug('📥 Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar texto');
      }

      if (!result.success) {
        throw new Error(result.error || 'Falha no processamento');
      }

      const processedText = result.text?.trim() || text;
      audioLog.debug('✨ Texto processado final:', processedText);
      
      return processedText;
    } catch (error: any) {
      audioLog.error('❌ Erro ao processar IA:', error);
      toast.error(error.message || 'Erro ao processar texto');
      return text;
    }
  };

  // Processar prompt customizado
  const processCustomPrompt = async (text: string): Promise<string> => {
    if (!customPrompt.trim()) {
      return text;
    }
    
    return await processAIAction(`${customPrompt}\n\nTexto original:`, text);
  };

  // Enviar mensagem
  const sendMessage = async (messageData: any) => {
    if (!activeConnection?.id) {
      toast.error('Nenhuma conexão ativa');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: jid,
          ...messageData
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      onMessageSent?.(result);
      
    } catch (error: any) {
      audioLog.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar texto
  const handleSendText = async () => {
    if (!message.trim()) return;

    await sendMessage({
      type: 'text',
      text: message.trim()
    });

    // Limpar rascunho da conversa atual
    clearDraft(jid);
    setMessage('');
  };

  // Enviar mídia
  const handleSendMedia = async (type: 'image' | 'video' | 'audio' | 'document', file: File, caption?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('connectionId', activeConnection?.id || '');
      formData.append('jid', jid);
      formData.append('type', type);
      if (caption) {
        formData.append('caption', caption);
      }

      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/baileys-simple/send-media-optimized`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mídia');
      }

      onMessageSent?.(result.data);
      
    } catch (error: any) {
      audioLog.error('Erro ao enviar mídia:', error);
      toast.error(error.message || 'Erro ao enviar mídia');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar localização
  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      await sendMessage({
        type: 'location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }, (error) => {
      toast.error('Erro ao obter localização');
    });
  };

  // Selecionar arquivo
  const handleFileSelect = (type: 'image' | 'video' | 'audio' | 'document' | 'media') => {
    if (type === 'media') {
      // Para mídia unificada, usar o input de imagem que aceita tanto imagens quanto vídeos
      imageInputRef.current?.click();
    } else {
      const inputRef = type === 'image' ? imageInputRef :
                      type === 'video' ? videoInputRef :
                      type === 'audio' ? audioInputRef :
                      documentInputRef;
      
      inputRef.current?.click();
    }
  };

  // Processar arquivo selecionado
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      // Se for o input unificado de mídia, detectar automaticamente o tipo
      let detectedType = type;
      if (type === 'image' && file.type.startsWith('video/')) {
        detectedType = 'video';
      } else if (type === 'image' && file.type.startsWith('image/')) {
        detectedType = 'image';
      }
      
      // Enviar mídia diretamente sem pedir descrição
      handleSendMedia(detectedType, file);
    }
  };

  // Tecla pressionada
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Clique no áudio
  const handleAudioClick = () => {
    audioLog.debug('🎤 [AUDIO-CLICK] Botão de microfone clicado');
    setShowAudioRecorder(true);
  };

  // Callback quando áudio é gravado
  const handleAudioRecordingComplete = async (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    await handleSendMedia('audio', audioFile);
    setShowAudioRecorder(false);
  };

  // Callback quando áudio é cancelado
  const handleAudioRecordingCancel = () => {
    audioLog.debug('🎤 [AUDIO-CANCEL] Cancelando gravação de áudio');
    setShowAudioRecorder(false);
  };

  // Aplicar ação de IA
  const handleAIAction = async (action: AIAction) => {
    audioLog.debug('🤖 Iniciando ação de IA:', action.label, 'Texto:', message);
    
    if (!message.trim()) {
      toast.error('Digite um texto primeiro');
      return;
    }

    // IA sempre disponível

    try {
      setAiProcessing(true);
      setShowAIMenu(false);
      audioLog.debug('🔄 Processando texto com IA...');
      
      toast.loading(`Processando ${action.label.toLowerCase()}...`, {
        id: 'ai-processing'
      });
      
      const processedText = await action.action(message);
      audioLog.debug('✅ Texto processado:', processedText);
      
      setMessage(processedText);
      toast.success(`${action.label} aplicado com sucesso!`, {
        id: 'ai-processing'
      });
    } catch (error) {
      audioLog.error('❌ Erro ao processar IA:', error);
      toast.error('Erro ao processar texto com IA', {
        id: 'ai-processing'
      });
    } finally {
      setAiProcessing(false);
    }
  };

  // Aplicar prompt customizado
  const handleCustomPrompt = async () => {
    if (!message.trim() || !customPrompt.trim()) {
      toast.error('Digite um texto e um prompt personalizado');
      return;
    }

    // IA sempre disponível

    try {
      setAiProcessing(true);
      setShowPromptInput(false);
      
      toast.loading('Processando prompt personalizado...', {
        id: 'custom-prompt'
      });
      
      const processedText = await processCustomPrompt(message);
      setMessage(processedText);
      setCustomPrompt('');
      
      toast.success('Prompt personalizado aplicado com sucesso!', {
        id: 'custom-prompt'
      });
    } catch (error) {
      audioLog.error('Erro ao aplicar prompt:', error);
      toast.error('Erro ao processar prompt personalizado', {
        id: 'custom-prompt'
      });
    } finally {
      setAiProcessing(false);
    }
  };

  // Salvar nota
  const handleSaveNote = () => {
    if (!note.trim()) return;
    
    // Criar um Post-It amarelo que aparece na conversa
    const noteElement = {
      id: `note-${Date.now()}`,
      type: 'note',
      content: note,
      timestamp: new Date(),
      isInternal: true
    };
    
    onNoteAdded?.(note);
    setNote('');
    setShowNoteInput(false);
    toast.success('Nota adicionada como Post-It!');
  };

  // Inserir emoji
  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiMenu(false);
  };

  // Alternar menu de emoji
  const toggleEmojiMenu = () => {
    setShowEmojiMenu(!showEmojiMenu);
    setShowAIMenu(false);
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Carregar rascunho quando mudar de conversa
  useEffect(() => {
    if (jid) {
      const savedDraft = getDraft(jid);
      setMessage(savedDraft);
    }
  }, [jid]); // Removido getDraft para evitar loop

  // Salvar rascunho quando o texto mudar (com debounce)
  useEffect(() => {
    if (jid && message !== undefined) {
      const timeoutId = setTimeout(() => {
        setDraft(jid, message);
        
        // Notificar componente pai sobre mudança no rascunho
        if (onDraftChange) {
          onDraftChange(jid, message);
        }
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [message, jid]); // Removido setDraft e onDraftChange para evitar loop

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setShowAIMenu(false);
      }
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target as Node)) {
        setShowEmojiMenu(false);
      }
    };

    if (showAIMenu || showEmojiMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAIMenu, showEmojiMenu]);

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Área de digitação principal */}
      <div className="p-4">
        <div className="flex items-end gap-3">
          {/* Campo de texto */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={showAudioRecorder ? "Gravando áudio..." : "Digite sua mensagem..."}
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-2xl border-gray-200 focus:ring-0 focus-visible:ring-0 focus:border-gray-200 focus-visible:border-gray-200 focus-visible:outline-none focus:outline-none focus:shadow-none focus-visible:shadow-none"
              disabled={isLoading || showAudioRecorder}
            />
          </div>

          {/* Botão de envio */}
          <Button
            onClick={handleSendText}
            disabled={!message.trim() || isLoading || showAudioRecorder}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Barra de botões inferior */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Botões da esquerda */}
          <div className="flex items-center gap-1">
            {/* Botão de IA */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIMenu(!showAIMenu)}
                disabled={aiProcessing}
                className="w-10 h-10 p-0 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
              >
                {aiProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>

              {/* Menu de IA */}
              {showAIMenu && (
                <div ref={aiMenuRef} className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-800">AI Prompts</span>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    {aiActions.map((action) => (
                        <button
                        key={action.id}
                        onClick={() => handleAIAction(action)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        <div className="text-blue-600">{action.icon}</div>
                        <span className="text-gray-700">{action.label}</span>
                      </button>
                    ))}
                    
                    {/* Prompt customizado */}
                    <button
                      onClick={() => {
                        setShowAIMenu(false);
                        setShowPromptInput(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      <div className="text-blue-600">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-gray-700">Prompt</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de emoji */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEmojiMenu}
                className="w-10 h-10 p-0 rounded-full text-gray-600 hover:bg-gray-100"
              >
                <Smile className="w-5 h-5" />
              </Button>

              {/* Menu de emojis */}
              {showEmojiMenu && (
                <div ref={emojiMenuRef} className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-800">Emojis</span>
                    </div>
                  </div>
                  
                  {/* Categorias */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(emojiCategories).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedEmojiCategory(category)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            selectedEmojiCategory === category
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Emojis */}
                  <div className="p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories]?.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiClick(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de áudio */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAudioClick}
              disabled={isLoading || showAudioRecorder}
              className="w-10 h-10 p-0 rounded-full text-gray-600 hover:bg-gray-100"
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* Botão de localização */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendLocation}
              disabled={isLoading}
              className="w-10 h-10 p-0 rounded-full text-gray-600 hover:bg-gray-100"
            >
              <MapPin className="w-5 h-5" />
            </Button>

            {/* Botão unificado de mídia (imagem/vídeo) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFileSelect('media')}
              disabled={isLoading}
              className="w-10 h-10 p-0 rounded-full text-gray-600 hover:bg-gray-100"
              title="Enviar imagem ou vídeo"
            >
              <Image className="w-5 h-5" />
            </Button>

            {/* Botão de arquivo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFileSelect('document')}
              disabled={isLoading}
              className="w-10 h-10 p-0 rounded-full text-gray-600 hover:bg-gray-100"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

          </div>

          {/* Botões da direita */}
          <div className="flex items-center gap-2">
            {/* Botão de adicionar nota */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-full"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Adicionar Nota</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Input de prompt customizado */}
      {showPromptInput && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Digite seu prompt personalizado..."
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleCustomPrompt}
              disabled={!customPrompt.trim() || !message.trim()}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              Aplicar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowPromptInput(false);
                setCustomPrompt('');
              }}
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Gravação de áudio */}
      {showAudioRecorder && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <AudioRecorder
            onRecordingComplete={handleAudioRecordingComplete}
            onCancel={handleAudioRecordingCancel}
            maxDuration={120} // 2 minutos
            className="w-full"
          />
        </div>
      )}

      {/* Input de nota - Post-It style */}
      {showNoteInput && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-800 text-sm font-bold">📝</span>
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-800 font-semibold text-sm mb-2">Nota Interna</h4>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Digite sua nota interna aqui..."
                  className="w-full min-h-[80px] resize-none bg-yellow-50 border-yellow-200 text-yellow-900 placeholder-yellow-600 focus:ring-yellow-400 focus:border-yellow-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveNote();
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-yellow-700">Esta nota será visível apenas para a equipe</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSaveNote}
                      disabled={!note.trim()}
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-medium px-4"
                    >
                      Salvar Nota
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNoteInput(false);
                        setNote('');
                      }}
                      className="text-yellow-700 hover:bg-yellow-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inputs de arquivo ocultos */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
        onChange={(e) => handleFileChange(e, 'document')}
        className="hidden"
      />
    </div>
  );
};
