"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";

import type { AssistantProduct, AssistantReply } from "@/lib/assistant";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  products?: AssistantProduct[];
};

const initialSuggestions = [
  "Buscar por menos de $80.000",
  "Como son los envios?",
  "Que medios de pago aceptan?",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ShoppingAssistant({ whatsappHref }: { whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hola. Puedo ayudarte a encontrar productos y resolver dudas sobre envios, pagos, stock o pedidos.",
    },
  ]);
  const messageId = useRef(1);
  const scrollArea = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      scrollArea.current?.scrollTo({ top: scrollArea.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || loading) return;

    const userId = ++messageId.current;
    setMessages((current) => [...current, { id: userId, role: "user", content: message }]);
    setInput("");
    setSuggestions([]);
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as AssistantReply | { error?: string };

      if (!response.ok || !("message" in data)) {
        throw new Error("error" in data ? data.error : undefined);
      }

      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content: data.message,
          products: data.products,
        },
      ]);
      setSuggestions(data.suggestions);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content: error instanceof Error && error.message
            ? error.message
            : "No pude responder en este momento. Podes continuar por WhatsApp.",
        },
      ]);
      setSuggestions(["Volver a intentar", "Hablar por WhatsApp"]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleSuggestion(suggestion: string) {
    if (suggestion === "Hablar por WhatsApp" && whatsappHref) {
      window.open(whatsappHref, "_blank", "noopener,noreferrer");
      return;
    }
    if (suggestion === "Ir a mis pedidos") {
      window.location.assign("/cuenta/pedidos");
      return;
    }
    if (suggestion === "Volver a intentar") {
      setSuggestions(initialSuggestions);
      inputRef.current?.focus();
      return;
    }
    void sendMessage(suggestion);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente de compras"
        aria-expanded="false"
        aria-controls="shopping-assistant-panel"
        className="fixed bottom-5 right-4 z-30 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-bold text-white shadow-xl ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Necesitas ayuda?</span>
      </button>
    );
  }

  return (
    <section
      id="shopping-assistant-panel"
      role="dialog"
      aria-label="Asistente de compras ErcLav"
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(720px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/15 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(650px,calc(100dvh-3rem))] sm:w-[400px]"
    >
      <header className="flex h-16 shrink-0 items-center gap-3 bg-neutral-950 px-4 text-white">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-neutral-950">
          <ShoppingBag className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold">Asistente ErcLav</h2>
          <p className="text-xs text-white/60">Atencion automatica</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar asistente"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] px-4 py-5" aria-live="polite">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "space-y-3"}>
              <div
                className={message.role === "user"
                  ? "max-w-[84%] rounded-lg rounded-br-sm bg-neutral-950 px-4 py-3 text-sm leading-5 text-white"
                  : "max-w-[88%] rounded-lg rounded-bl-sm bg-white px-4 py-3 text-sm leading-5 text-neutral-700 shadow-sm ring-1 ring-black/5"}
              >
                {message.content}
              </div>
              {message.products?.length ? (
                <div className="space-y-2">
                  {message.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/productos/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex min-h-24 items-center gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-black/15"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#ebe9e4]">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-xs text-neutral-500">Sin imagen</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <p className="truncate text-xs font-bold uppercase text-neutral-500">{product.brand}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-bold leading-4 text-neutral-950">{product.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-black text-neutral-950">{formatMoney(product.price)}</span>
                          {product.originalPrice ? <span className="text-xs text-neutral-500 line-through">{formatMoney(product.originalPrice)}</span> : null}
                          <span className={product.available > 0 ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-red-700"}>
                            {product.available > 0 ? "Disponible" : "Sin stock"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="mr-1 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-950" aria-hidden />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? (
            <div className="flex w-fit items-center gap-2 rounded-lg rounded-bl-sm bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm ring-1 ring-black/5">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Consultando el catalogo...
            </div>
          ) : null}
        </div>
      </div>

      {suggestions.length ? (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-t border-black/5 bg-white px-4 py-3">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => handleSuggestion(suggestion)} disabled={loading} className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-black/30 hover:bg-neutral-50 disabled:opacity-50">
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="shrink-0 border-t border-black/10 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mb-3 flex h-10 items-center justify-center gap-2 rounded-md bg-[#eaf8ef] px-3 text-xs font-bold text-[#116b32] transition hover:bg-[#dcf3e4]">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Continuar con una persona por WhatsApp
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="assistant-message" className="sr-only">Escribi tu consulta</label>
          <input ref={inputRef} id="assistant-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} autoComplete="off" placeholder="Que estas buscando?" className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-[#f2f0eb] px-4 text-sm outline-none transition placeholder:text-neutral-500 focus:border-black/30 focus:bg-white" />
          <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar consulta" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300">
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
