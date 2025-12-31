import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tools generici e flessibili - Claude sceglie quelli giusti in base alla domanda
const tools: Anthropic.Tool[] = [
  {
    name: "search_emails",
    description:
      "Cerca email nel database. Può filtrare per mittente, oggetto, contenuto, data. Usa questo per trovare email specifiche o gruppi di email.",
    input_schema: {
      type: "object" as const,
      properties: {
        from_name: {
          type: "string",
          description: "Nome del mittente (ricerca parziale)",
        },
        from_email: {
          type: "string",
          description: "Email del mittente (ricerca parziale)",
        },
        subject_contains: {
          type: "string",
          description: "Testo contenuto nell'oggetto",
        },
        body_contains: {
          type: "string",
          description: "Testo contenuto nel corpo",
        },
        labels: { type: "string", description: "Filtra per label/categoria" },
        date_from: { type: "string", description: "Data inizio (YYYY-MM-DD)" },
        date_to: { type: "string", description: "Data fine (YYYY-MM-DD)" },
        limit: {
          type: "number",
          description: "Max risultati (default 20, max 100)",
        },
        offset: { type: "number", description: "Offset per paginazione" },
        order_by: {
          type: "string",
          enum: ["created_at", "from_name", "subject"],
          description: "Campo per ordinamento",
        },
        order_direction: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Direzione ordinamento",
        },
      },
      required: [],
    },
  },
  {
    name: "get_email_by_id",
    description:
      "Recupera un'email specifica con tutti i dettagli completi incluso HTML",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "ID dell'email" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_statistics",
    description:
      "Ottieni statistiche aggregate sul database email. Usa per conteggi, distribuzioni, trend.",
    input_schema: {
      type: "object" as const,
      properties: {
        stat_type: {
          type: "string",
          enum: [
            "total_count",
            "count_by_sender",
            "count_by_domain",
            "count_by_label",
            "count_by_month",
            "count_by_day_of_week",
            "top_senders",
            "recent_activity",
          ],
          description: "Tipo di statistica",
        },
        limit: {
          type: "number",
          description: "Numero di risultati per statistiche top/ranking",
        },
      },
      required: ["stat_type"],
    },
  },
  {
    name: "analyze_sender",
    description:
      "Analizza un mittente specifico: tutte le sue email, frequenza, pattern, oggetti comuni",
    input_schema: {
      type: "object" as const,
      properties: {
        sender_name: {
          type: "string",
          description: "Nome del mittente da analizzare",
        },
        sender_email: {
          type: "string",
          description: "Email del mittente da analizzare",
        },
      },
      required: [],
    },
  },
  {
    name: "find_patterns",
    description:
      "Trova pattern ricorrenti: parole comuni negli oggetti, strutture email, tecniche di marketing",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern_type: {
          type: "string",
          enum: [
            "common_subject_words",
            "email_length_distribution",
            "sending_times",
            "call_to_action_patterns",
            "urgency_keywords",
            "promotional_patterns",
          ],
          description: "Tipo di pattern da cercare",
        },
        sample_size: {
          type: "number",
          description: "Numero di email da analizzare (default 100)",
        },
        filter_sender: {
          type: "string",
          description: "Opzionale: analizza solo un mittente",
        },
      },
      required: ["pattern_type"],
    },
  },
  {
    name: "compare_senders",
    description:
      "Confronta due o più mittenti: stile, frequenza, tecniche utilizzate",
    input_schema: {
      type: "object" as const,
      properties: {
        senders: {
          type: "array",
          items: { type: "string" },
          description: "Lista di nomi mittenti da confrontare",
        },
      },
      required: ["senders"],
    },
  },
  {
    name: "get_sample_emails",
    description:
      "Ottieni un campione di email per analisi qualitativa o esempi",
    input_schema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Numero di email nel campione (max 10)",
        },
        include_body: {
          type: "boolean",
          description: "Includere il testo completo",
        },
        from_name: {
          type: "string",
          description: "Filtra per mittente specifico",
        },
      },
      required: [],
    },
  },
  {
    name: "full_text_search",
    description:
      "Ricerca full-text avanzata nel contenuto delle email. Cerca in oggetti e corpi delle email.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Testo da cercare",
        },
        search_in: {
          type: "string",
          enum: ["subject", "body", "both"],
          description: "Dove cercare: solo oggetto, solo corpo, o entrambi",
        },
        limit: {
          type: "number",
          description: "Max risultati",
        },
      },
      required: ["query"],
    },
  },
];

// Implementazione dei tools
async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (toolName) {
      case "search_emails": {
        let query = supabase
          .from("emails")
          .select(
            "id, from_name, from_email, subject, labels, created_at, text_body"
          );

        if (toolInput.from_name) {
          query = query.ilike("from_name", `%${toolInput.from_name}%`);
        }
        if (toolInput.from_email) {
          query = query.ilike("from_email", `%${toolInput.from_email}%`);
        }
        if (toolInput.subject_contains) {
          query = query.ilike("subject", `%${toolInput.subject_contains}%`);
        }
        if (toolInput.body_contains) {
          query = query.ilike("text_body", `%${toolInput.body_contains}%`);
        }
        if (toolInput.labels) {
          query = query.ilike("labels", `%${toolInput.labels}%`);
        }
        if (toolInput.date_from) {
          query = query.gte("created_at", toolInput.date_from);
        }
        if (toolInput.date_to) {
          query = query.lte("created_at", toolInput.date_to);
        }

        const orderBy = (toolInput.order_by as string) || "created_at";
        const orderDir = toolInput.order_direction === "asc";
        query = query.order(orderBy, { ascending: orderDir });

        const limit = Math.min((toolInput.limit as number) || 20, 100);
        query = query.limit(limit);

        if (toolInput.offset) {
          query = query.range(
            toolInput.offset as number,
            (toolInput.offset as number) + limit - 1
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        // Trunca text_body per risparmiare token
        return data?.map((email) => ({
          ...email,
          text_body:
            email.text_body?.substring(0, 500) +
            (email.text_body?.length > 500 ? "..." : ""),
        }));
      }

      case "get_email_by_id": {
        const { data, error } = await supabase
          .from("emails")
          .select("*")
          .eq("id", toolInput.id)
          .single();
        if (error) throw error;
        return data;
      }

      case "get_statistics": {
        const { data: allEmails, error } = await supabase
          .from("emails")
          .select("from_name, from_email, labels, created_at");

        if (error) throw error;

        const limit = (toolInput.limit as number) || 20;

        switch (toolInput.stat_type) {
          case "total_count":
            return { total_emails: allEmails?.length || 0 };

          case "count_by_sender":
          case "top_senders": {
            const senderCounts: Record<string, number> = {};
            allEmails?.forEach((e) => {
              const sender = e.from_name || e.from_email || "Unknown";
              senderCounts[sender] = (senderCounts[sender] || 0) + 1;
            });
            return Object.entries(senderCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, limit)
              .map(([sender, count]) => ({ sender, count }));
          }

          case "count_by_domain": {
            const domainCounts: Record<string, number> = {};
            allEmails?.forEach((e) => {
              const domain = e.from_email?.split("@")[1] || "unknown";
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            });
            return Object.entries(domainCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, limit)
              .map(([domain, count]) => ({ domain, count }));
          }

          case "count_by_label": {
            const labelCounts: Record<string, number> = {};
            allEmails?.forEach((e) => {
              const labels =
                e.labels?.split(",").map((l: string) => l.trim()) || [
                  "No Label",
                ];
              labels.forEach((label: string) => {
                labelCounts[label] = (labelCounts[label] || 0) + 1;
              });
            });
            return Object.entries(labelCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => ({ label, count }));
          }

          case "count_by_month": {
            const monthCounts: Record<string, number> = {};
            allEmails?.forEach((e) => {
              const month = e.created_at?.substring(0, 7) || "unknown";
              monthCounts[month] = (monthCounts[month] || 0) + 1;
            });
            return Object.entries(monthCounts)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, count]) => ({ month, count }));
          }

          case "count_by_day_of_week": {
            const days = [
              "Domenica",
              "Lunedì",
              "Martedì",
              "Mercoledì",
              "Giovedì",
              "Venerdì",
              "Sabato",
            ];
            const dayCounts: Record<string, number> = {};
            allEmails?.forEach((e) => {
              const day = days[new Date(e.created_at).getDay()];
              dayCounts[day] = (dayCounts[day] || 0) + 1;
            });
            return days.map((day) => ({ day, count: dayCounts[day] || 0 }));
          }

          case "recent_activity": {
            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            const recent = allEmails?.filter(
              (e) => new Date(e.created_at) > last30Days
            );
            return {
              emails_last_30_days: recent?.length || 0,
              unique_senders: new Set(recent?.map((e) => e.from_email)).size,
            };
          }

          default:
            return { error: "Unknown stat_type" };
        }
      }

      case "analyze_sender": {
        let query = supabase.from("emails").select("*");

        if (toolInput.sender_name) {
          query = query.ilike("from_name", `%${toolInput.sender_name}%`);
        }
        if (toolInput.sender_email) {
          query = query.ilike("from_email", `%${toolInput.sender_email}%`);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });
        if (error) throw error;

        const emails = data || [];
        return {
          total_emails: emails.length,
          sender_info: emails[0]
            ? { name: emails[0].from_name, email: emails[0].from_email }
            : null,
          date_range: {
            first_email: emails[emails.length - 1]?.created_at,
            last_email: emails[0]?.created_at,
          },
          subjects: emails.slice(0, 20).map((e) => e.subject),
          labels_used: [
            ...new Set(
              emails.flatMap(
                (e) => e.labels?.split(",").map((l: string) => l.trim()) || []
              )
            ),
          ],
          avg_email_length: Math.round(
            emails.reduce((acc, e) => acc + (e.text_body?.length || 0), 0) /
              emails.length
          ),
        };
      }

      case "find_patterns": {
        const sampleSize = Math.min(
          (toolInput.sample_size as number) || 100,
          500
        );
        let query = supabase
          .from("emails")
          .select("subject, text_body, created_at, from_name");

        if (toolInput.filter_sender) {
          query = query.ilike("from_name", `%${toolInput.filter_sender}%`);
        }

        const { data, error } = await query.limit(sampleSize);
        if (error) throw error;

        const emails = data || [];

        switch (toolInput.pattern_type) {
          case "common_subject_words": {
            const words: Record<string, number> = {};
            const stopWords = new Set([
              "the",
              "a",
              "an",
              "and",
              "or",
              "but",
              "in",
              "on",
              "at",
              "to",
              "for",
              "of",
              "your",
              "you",
              "is",
              "it",
              "this",
              "that",
              "with",
              "from",
              "il",
              "la",
              "le",
              "i",
              "un",
              "una",
              "e",
              "di",
              "da",
              "per",
              "con",
              "su",
              "che",
              "non",
            ]);

            emails.forEach((e) => {
              e.subject
                ?.toLowerCase()
                .split(/\s+/)
                .forEach((word: string) => {
                  const clean = word.replace(/[^a-zàèìòù0-9]/gi, "");
                  if (clean.length > 2 && !stopWords.has(clean)) {
                    words[clean] = (words[clean] || 0) + 1;
                  }
                });
            });

            return Object.entries(words)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 30)
              .map(([word, count]) => ({
                word,
                count,
                percentage: Math.round((count / emails.length) * 100),
              }));
          }

          case "urgency_keywords": {
            const urgencyWords = [
              "urgente",
              "ultimo",
              "ultima",
              "scade",
              "oggi",
              "ora",
              "subito",
              "limited",
              "last",
              "final",
              "hurry",
              "now",
              "today",
              "expires",
              "ending",
              "24h",
              "48h",
              "ore",
              "hours",
            ];
            const matches: Record<string, number> = {};

            emails.forEach((e) => {
              const text = (e.subject + " " + e.text_body).toLowerCase();
              urgencyWords.forEach((word) => {
                if (text.includes(word)) {
                  matches[word] = (matches[word] || 0) + 1;
                }
              });
            });

            return {
              urgency_keywords_found: Object.entries(matches)
                .sort((a, b) => b[1] - a[1])
                .map(([word, count]) => ({ word, count })),
              emails_with_urgency: Object.values(matches).reduce(
                (a, b) => a + b,
                0
              ),
            };
          }

          case "promotional_patterns": {
            const patterns = {
              discount_mentions: 0,
              percentage_off: 0,
              free_shipping: 0,
              limited_time: 0,
              exclusive_offer: 0,
              call_to_action: 0,
            };

            emails.forEach((e) => {
              const text = (e.subject + " " + e.text_body).toLowerCase();
              if (/\d+%/.test(text)) patterns.percentage_off++;
              if (/sconto|discount|off|risparmia|save/.test(text))
                patterns.discount_mentions++;
              if (/spedizione gratuita|free shipping|gratis/.test(text))
                patterns.free_shipping++;
              if (/tempo limitato|limited time|solo oggi|only today/.test(text))
                patterns.limited_time++;
              if (/esclusiv|exclusive|solo per te|just for you/.test(text))
                patterns.exclusive_offer++;
              if (/compra ora|buy now|acquista|shop now|scopri|click/.test(text))
                patterns.call_to_action++;
            });

            return {
              total_analyzed: emails.length,
              patterns: Object.entries(patterns).map(([pattern, count]) => ({
                pattern,
                count,
                percentage: Math.round((count / emails.length) * 100),
              })),
            };
          }

          case "email_length_distribution": {
            const lengths = emails.map((e) => e.text_body?.length || 0);
            const sorted = lengths.sort((a, b) => a - b);
            return {
              min: sorted[0],
              max: sorted[sorted.length - 1],
              average: Math.round(
                lengths.reduce((a, b) => a + b, 0) / lengths.length
              ),
              median: sorted[Math.floor(sorted.length / 2)],
              distribution: {
                "short (< 500 chars)": lengths.filter((l) => l < 500).length,
                "medium (500-2000 chars)": lengths.filter(
                  (l) => l >= 500 && l < 2000
                ).length,
                "long (> 2000 chars)": lengths.filter((l) => l >= 2000).length,
              },
            };
          }

          case "sending_times": {
            const hours: Record<number, number> = {};
            emails.forEach((e) => {
              const hour = new Date(e.created_at).getHours();
              hours[hour] = (hours[hour] || 0) + 1;
            });
            return Array.from({ length: 24 }, (_, i) => ({
              hour: `${i}:00`,
              count: hours[i] || 0,
            }));
          }

          case "call_to_action_patterns": {
            const ctaPatterns = [
              "compra ora",
              "buy now",
              "acquista",
              "shop now",
              "scopri",
              "click here",
              "clicca qui",
              "get started",
              "inizia ora",
              "prova gratis",
              "free trial",
              "iscriviti",
              "subscribe",
              "join now",
              "learn more",
              "scopri di più",
            ];
            const matches: Record<string, number> = {};

            emails.forEach((e) => {
              const text = (e.subject + " " + e.text_body).toLowerCase();
              ctaPatterns.forEach((cta) => {
                if (text.includes(cta)) {
                  matches[cta] = (matches[cta] || 0) + 1;
                }
              });
            });

            return Object.entries(matches)
              .sort((a, b) => b[1] - a[1])
              .map(([cta, count]) => ({ cta, count }));
          }

          default:
            return { error: "Unknown pattern_type" };
        }
      }

      case "compare_senders": {
        const senders = toolInput.senders as string[];
        const comparisons = [];

        for (const sender of senders) {
          const { data } = await supabase
            .from("emails")
            .select("subject, text_body, created_at, labels")
            .ilike("from_name", `%${sender}%`);

          const emails = data || [];
          comparisons.push({
            sender,
            total_emails: emails.length,
            avg_subject_length: Math.round(
              emails.reduce((acc, e) => acc + (e.subject?.length || 0), 0) /
                emails.length
            ),
            avg_body_length: Math.round(
              emails.reduce((acc, e) => acc + (e.text_body?.length || 0), 0) /
                emails.length
            ),
            sample_subjects: emails.slice(0, 5).map((e) => e.subject),
          });
        }

        return comparisons;
      }

      case "get_sample_emails": {
        const count = Math.min((toolInput.count as number) || 5, 10);
        let query = supabase
          .from("emails")
          .select(
            toolInput.include_body
              ? "*"
              : "id, from_name, from_email, subject, labels, created_at"
          );

        if (toolInput.from_name) {
          query = query.ilike("from_name", `%${toolInput.from_name}%`);
        }

        const { data, error } = await query.limit(count);

        if (error) throw error;
        return data;
      }

      case "full_text_search": {
        const searchQuery = toolInput.query as string;
        const searchIn = (toolInput.search_in as string) || "both";
        const limit = Math.min((toolInput.limit as number) || 20, 50);

        let query = supabase
          .from("emails")
          .select(
            "id, from_name, from_email, subject, text_body, labels, created_at"
          );

        if (searchIn === "subject") {
          query = query.ilike("subject", `%${searchQuery}%`);
        } else if (searchIn === "body") {
          query = query.ilike("text_body", `%${searchQuery}%`);
        } else {
          query = query.or(
            `subject.ilike.%${searchQuery}%,text_body.ilike.%${searchQuery}%`
          );
        }

        const { data, error } = await query.limit(limit);
        if (error) throw error;

        return data?.map((email) => ({
          ...email,
          text_body:
            email.text_body?.substring(0, 300) +
            (email.text_body?.length > 300 ? "..." : ""),
        }));
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const systemPrompt = `Sei un esperto analista di dati email marketing. Hai accesso a un database di email di marketing raccolte da vari brand.

Il tuo compito è:
1. Capire cosa l'utente vuole sapere
2. Usare i tools disponibili per recuperare i dati necessari
3. Analizzare i dati e fornire insights utili
4. Rispondere sempre in italiano in modo chiaro e dettagliato

Puoi usare più tools in sequenza se necessario. Per esempio:
- Per "analizzami i pattern" → usa find_patterns con diversi pattern_type
- Per "confronta X e Y" → usa compare_senders
- Per statistiche generali → usa get_statistics
- Per cercare email specifiche → usa search_emails o full_text_search

Quando presenti dati:
- Usa tabelle markdown quando appropriato
- Evidenzia i pattern interessanti
- Suggerisci actionable insights
- Sii specifico con numeri e percentuali

Non inventare dati - usa sempre i tools per recuperare informazioni reali dal database.`;

    // Agentic loop - Claude può chiamare più tools
    let currentMessages = messages;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      });

      // If Claude is done, return the response
      if (response.stop_reason === "end_turn") {
        const textContent = response.content.find((c) => c.type === "text");
        return NextResponse.json({
          success: true,
          response: textContent ? textContent.text : "",
          conversationHistory: [
            ...currentMessages,
            { role: "assistant", content: response.content },
          ],
        });
      }

      // If Claude wants to use tools
      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`Executing tool: ${toolUse.name}`, toolUse.input);
          const result = await executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, null, 2),
          });
        }

        // Add assistant message and tool results
        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ];
      }
    }

    return NextResponse.json(
      {
        error: "Max iterations reached",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Chat Database API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

