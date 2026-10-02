"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
    Send,
    Lightbulb,
    Copy,
    Check,
    Loader2,
    MessageSquare,
    Sparkles,
    Eye,
    EyeOff,
    Trash2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const suggestedQueries = [
    "What semiconductor shortages are currently affecting Taiwan?",
    "Which vendors have the highest concentration risk?",
    "What weather events are impacting shipping routes this week?",
    "Are there any new trade restrictions affecting China?",
    "What is the current risk level for automotive supply chains?",
];

/**
 * Strip <think> blocks from AI output and optionally extract them
 */
function processAIOutput(text: string): { content: string; thinking: string } {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let thinking = "";

    const matches = text.matchAll(thinkRegex);
    for (const match of matches) {
        thinking += match[1].trim() + "\n\n";
    }

    const content = text.replace(thinkRegex, "").trim();
    return { content, thinking: thinking.trim() };
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    sources?: Array<{
        id: string;
        title: string;
        snippet: string;
        relevance_score: number;
    }>;
    processing_time_ms?: number;
    thinking?: string;
}

export default function QueryPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [copied, setCopied] = useState<number | null>(null);
    const [showThinking, setShowThinking] = useState<{ [key: number]: boolean }>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const chatMutation = useMutation({
        mutationFn: async (userMessage: string) => {
            const newMessages = [
                ...messages,
                { role: "user" as const, content: userMessage },
            ];

            const response = await fetch(`${API_BASE}/api/rag/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    context_limit: 5,
                    include_sources: true,
                }),
            });

            if (!response.ok) {
                return {
                    message: {
                        role: "assistant" as const,
                        content:
                            "I don't have enough data yet to answer this question comprehensively. Please run the scraping system first to gather supply chain data, or try a more specific query.",
                    },
                    sources: [],
                    processing_time_ms: 0,
                };
            }

            return response.json();
        },
        onSuccess: (data) => {
            const { content, thinking } = processAIOutput(data.message.content);
            setMessages((prev) => [
                ...prev.slice(0, -1), // Remove temporary user message
                prev[prev.length - 1], // Add back user message
                {
                    role: "assistant",
                    content,
                    sources: data.sources,
                    processing_time_ms: data.processing_time_ms,
                    thinking,
                },
            ]);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !chatMutation.isPending) {
            // Add user message immediately
            setMessages((prev) => [...prev, { role: "user", content: input }]);
            chatMutation.mutate(input);
            setInput("");
        }
    };

    const handleCopy = (index: number, content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
    };

    const clearConversation = () => {
        setMessages([]);
        setShowThinking({});
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        Ask Edgecase AI
                    </h1>
                    <p className="text-muted-foreground">
                        Ask questions about your supply chain data in natural language
                    </p>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearConversation}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted hover:bg-muted/80 text-sm cursor-pointer transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                    /* Suggested Queries */
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                            <h2 className="font-semibold">Suggested Questions</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQueries.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        setMessages([{ role: "user", content: suggestion }]);
                                        chatMutation.mutate(suggestion);
                                        setInput("");
                                    }}
                                    className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-left transition-colors cursor-pointer"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat Messages */
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-xl p-4 ${message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-card border"
                                    }`}
                            >
                                {message.role === "user" ? (
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* AI Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-primary" />
                                                <span className="font-medium">Edgecase AI</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {message.thinking && (
                                                    <button
                                                        onClick={() =>
                                                            setShowThinking((prev) => ({
                                                                ...prev,
                                                                [index]: !prev[index],
                                                            }))
                                                        }
                                                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                                                    >
                                                        {showThinking[index] ? (
                                                            <EyeOff className="w-3 h-3" />
                                                        ) : (
                                                            <Eye className="w-3 h-3" />
                                                        )}
                                                        {showThinking[index] ? "Hide" : "Show"} Thinking
                                                    </button>
                                                )}
                                                {message.processing_time_ms !== undefined && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {message.processing_time_ms}ms
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handleCopy(index, message.content)}
                                                    className="p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                                                >
                                                    {copied === index ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Response */}
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>

                                        {/* Thinking Block */}
                                        {message.thinking && showThinking[index] && (
                                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                                                    💭 AI Reasoning
                                                </p>
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                                    <ReactMarkdown>{message.thinking}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sources */}
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t">
                                                <p className="text-sm font-medium mb-2">Sources</p>
                                                <div className="space-y-2">
                                                    {message.sources.map((source) => (
                                                        <div
                                                            key={source.id}
                                                            className="p-2 rounded-lg bg-muted/50 text-xs"
                                                        >
                                                            <p className="font-medium">{source.title}</p>
                                                            <p className="text-muted-foreground mt-1 line-clamp-2">
                                                                {source.snippet}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {chatMutation.isPending && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl p-4 bg-card border">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up question or start a new topic..."
                    className="w-full px-5 py-4 pr-14 rounded-xl bg-card border focus:ring-2 focus:ring-primary outline-none"
                    disabled={chatMutation.isPending}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || chatMutation.isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
                >
                    {chatMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>
        </div>
    );
}
