import React, { useState } from 'react';
import { CheckCircle, Wifi, Eye, Power, MessageCircle, Calendar, Video, Mail, Database } from 'lucide-react';
import GoogleIntegrationModal from './integrations/GoogleIntegrationModal';
import FacebookIntegrationModal from './integrations/FacebookIntegrationModal';
import InstagramIntegrationModal from './integrations/InstagramIntegrationModal';

type Props = {
  onConnectBaileys: () => void;
  onConnectWebhook: () => void;
  onConnectGoogle?: () => void;
  onConnectFacebook?: () => void;
  onConnectInstagram?: () => void;
  baileysConnected?: boolean;
  webhookConnected?: boolean;
  googleConnected?: boolean;
  facebookConnected?: boolean;
  instagramConnected?: boolean;
  activeConnection?: {
    id: string;
    name: string;
    whatsappName?: string;
    type: string;
    connectedAt?: string;
  };
  onViewDetails?: (connectionId: string) => void;
  onDisconnect?: (connectionId: string) => void;
};

export default function ConnectionsOptionsGrid({ 
  onConnectBaileys, 
  onConnectWebhook,
  onConnectGoogle,
  onConnectFacebook,
  onConnectInstagram,
  baileysConnected = false, 
  webhookConnected = false,
  googleConnected = false,
  facebookConnected = false,
  instagramConnected = false,
  activeConnection,
  onViewDetails,
  onDisconnect
}: Props) {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  return (
    <div className="mt-4 space-y-8">
      {/* Canais */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Canais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Baileys (WhatsApp Web) */}
          <div className={`group relative rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
            baileysConnected 
              ? 'border-green-300/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50' 
              : 'border-gray-200/50 bg-gradient-to-br from-white via-gray-50 to-slate-50'
          }`}>
            {/* Badge Conectado no canto superior direito */}
            {baileysConnected && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-800 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200/50 shadow-sm">
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${
                baileysConnected 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 ring-2 ring-green-200/50' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-100/50'
              }`}>
                {baileysConnected ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <img 
                    src="https://img.icons8.com/color/48/whatsapp--v1.png" 
                    alt="WhatsApp" 
                    className="w-10 h-10"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {baileysConnected && activeConnection ? activeConnection.name : 'WhatsApp Web'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {baileysConnected 
                    ? 'Conectado via WhatsApp Web - Pronto para enviar e receber mensagens.'
                    : 'Conecte via WhatsApp Web para enviar e receber mensagens.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              {!baileysConnected && (
                <button
                  onClick={onConnectBaileys}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Botões de Ação - apenas quando conectado */}
            {baileysConnected && activeConnection && (
              <div className="mt-6 flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(activeConnection.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )}
                
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect(activeConnection.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Webhook */}
          <div className={`group relative rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
            webhookConnected 
              ? 'border-blue-300/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
              : 'border-gray-200/50 bg-gradient-to-br from-white via-gray-50 to-slate-50'
          }`}>
            {/* Badge Conectado no canto superior direito */}
            {webhookConnected && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200/50 shadow-sm">
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${
                webhookConnected 
                  ? 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-blue-200/50' 
                  : 'bg-gradient-to-br from-slate-50 to-gray-50 ring-2 ring-slate-100/50'
              }`}>
                {webhookConnected ? (
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                ) : (
                  <img 
                    src="https://img.icons8.com/color/48/webhook.png" 
                    alt="Webhook" 
                    className="w-10 h-10"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {webhookConnected && activeConnection ? activeConnection.name : 'Conexão de Webhook'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {webhookConnected 
                    ? 'Conectado - Recebendo eventos e enviando mensagens através do endpoint.'
                    : 'Receba eventos e envie mensagens através do seu endpoint.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              {!webhookConnected && (
                <button
                  onClick={onConnectWebhook}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Botões de Ação - apenas quando conectado */}
            {webhookConnected && activeConnection && (
              <div className="mt-6 flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(activeConnection.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )}
                
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect(activeConnection.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrações */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-green-600" />
          Integrações
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Google */}
          <div className={`group relative rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
            googleConnected 
              ? 'border-blue-300/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
              : 'border-gray-200/50 bg-gradient-to-br from-white via-gray-50 to-slate-50'
          }`}>
            {/* Badge Conectado no canto superior direito */}
            {googleConnected && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200/50 shadow-sm">
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${
                googleConnected 
                  ? 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-blue-200/50' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-100/50'
              }`}>
                {googleConnected ? (
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                ) : (
                  <img 
                    src="https://img.icons8.com/color/48/google-logo.png" 
                    alt="Google" 
                    className="w-10 h-10"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Google</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {googleConnected 
                    ? 'Conectado - Crie eventos no Calendar, gere reuniões no Meet, envie emails e gerencie arquivos no Drive.'
                    : 'Crie eventos no Calendar, gere reuniões no Meet, envie emails e gerencie arquivos no Drive.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              {!googleConnected && (
                <button
                  onClick={() => setShowGoogleModal(true)}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Botões de Ação - apenas quando conectado */}
            {googleConnected && (
              <div className="mt-6 flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails('google')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )}
                
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect('google')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Facebook */}
          <div className={`group relative rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
            facebookConnected 
              ? 'border-blue-300/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
              : 'border-gray-200/50 bg-gradient-to-br from-white via-gray-50 to-slate-50'
          }`}>
            {/* Badge Conectado no canto superior direito */}
            {facebookConnected && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200/50 shadow-sm">
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${
                facebookConnected 
                  ? 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-blue-200/50' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-100/50'
              }`}>
                {facebookConnected ? (
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                ) : (
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Facebook_icon.svg" 
                    alt="Facebook" 
                    className="w-10 h-10"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Facebook</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {facebookConnected 
                    ? 'Conectado - Gerencie posts, comentários e insights das suas páginas do Facebook.'
                    : 'Gerencie posts, comentários e insights das suas páginas do Facebook.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              {!facebookConnected && (
                <button
                  onClick={() => setShowFacebookModal(true)}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Botões de Ação - apenas quando conectado */}
            {facebookConnected && (
              <div className="mt-6 flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails('facebook')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )}
                
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect('facebook')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Instagram */}
          <div className={`group relative rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
            instagramConnected 
              ? 'border-pink-300/50 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50' 
              : 'border-gray-200/50 bg-gradient-to-br from-white via-gray-50 to-slate-50'
          }`}>
            {/* Badge Conectado no canto superior direito */}
            {instagramConnected && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-pink-800 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full border border-pink-200/50 shadow-sm">
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg ${
                instagramConnected 
                  ? 'bg-gradient-to-br from-pink-100 to-rose-100 ring-2 ring-pink-200/50' 
                  : 'bg-gradient-to-br from-pink-50 to-rose-50 ring-2 ring-pink-100/50'
              }`}>
                {instagramConnected ? (
                  <CheckCircle className="w-10 h-10 text-pink-600" />
                ) : (
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                    alt="Instagram" 
                    className="w-10 h-10"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Instagram</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {instagramConnected 
                    ? 'Conectado - Gerencie mídia, comentários e estatísticas do seu perfil do Instagram.'
                    : 'Gerencie mídia, comentários e estatísticas do seu perfil do Instagram.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              {!instagramConnected && (
                <button
                  onClick={() => setShowInstagramModal(true)}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Botões de Ação - apenas quando conectado */}
            {instagramConnected && (
              <div className="mt-6 flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails('instagram')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )}
                
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect('instagram')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais de Integração */}
      <GoogleIntegrationModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onConnect={() => {}}
        onSuccess={(data) => {
          console.log('Google conectado:', data);
          setShowGoogleModal(false);
          // Recarregar dados se necessário
        }}
      />

      <FacebookIntegrationModal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        onConnect={() => {}}
        onSuccess={(data) => {
          console.log('Facebook conectado:', data);
          setShowFacebookModal(false);
          // Recarregar dados se necessário
        }}
      />

      <InstagramIntegrationModal
        isOpen={showInstagramModal}
        onClose={() => setShowInstagramModal(false)}
        onConnect={() => {}}
        onSuccess={(data) => {
          console.log('Instagram conectado:', data);
          setShowInstagramModal(false);
          // Recarregar dados se necessário
        }}
      />
    </div>
  );
}
