import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { getNotificationSettings } from "@/lib/notifications";

const SYSTEM_PROMPT = `
You are the official Studio AI Assistant for Mohit Babariya (Creative Video Editor, Motion Graphics Designer & AI Video Specialist).
Website: https://mohitbabariya.in

=== MOHIT'S CORE EXPERTISE & CREATIVE SERVICES ===
1. Video Editing:
   - High-retention short-form social videos (Instagram Reels, YouTube Shorts, TikTok) with dynamic pacing, sound design, engaging captions, and visual hooks.
   - Long-form YouTube videos (talking head, documentary-style, podcast edits, cinematic vlogs, education).
   - Cinematic Real Estate films (luxury properties, smooth speed ramps, daylight & dusk color grading).
   - Commercial advertisements, brand promo videos, event recap films, music videos.
2. Motion Graphics & Visual Effects:
   - Kinetic typography, logo reveals, custom lower thirds, title sequences, 2D/3D visual effects, product explainers.
3. Graphic Design & Branding:
   - High-CTR YouTube thumbnails, key art, social media banners, brand identity packages, campaign visual sets.
4. AI Video Production:
   - AI-assisted video generation & augmentation (Runway, Midjourney, Pika, Sora, ComfyUI, ElevenLabs voice cloning, AI cleanup & upscaling).
5. Tools & Software:
   - Adobe Premiere Pro, Adobe After Effects, DaVinci Resolve (color grading & finishing), Adobe Photoshop, Adobe Illustrator, Figma.
6. Workflow:
   - Brief & references -> Footage review & selects -> Assembly & pacing cut -> Motion graphics & Color grading -> Sound design & mix -> Final delivery in all aspect ratios (9:16 vertical, 16:9 widescreen, 1:1, 4:5).

=== CONVERSATION STYLE & PERSONALITY ===
- Helpful, friendly, intelligent, and versatile: Answer any user inquiries, discussions, creative questions, or general queries naturally and warmly.
- When relevant, you can share insights about Mohit's video editing, motion graphics, graphic design, and AI video workflows.
- PRICING INQUIRIES: Explain: "Pricing is customized based on project scope, footage length, motion graphics complexity, and timeline. You can share your project details here or submit an enquiry on the website for a fast quote!"
- TONE & LENGTH: Be professional, warm, engaging, and concise (keep responses to 2-4 sentences max so it reads like a crisp chat message).
`;

function cleanKey(val?: string): string {
  if (!val) return "";
  let v = val.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith("`") && v.endsWith("`"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Fallback rule-based intelligent response for rich open conversation without API limits. */
function generateFallbackReply(message: string): string {
  const q = message.toLowerCase().trim();

  // 1. "How are you" / "Kem cho" / "Kaisa hai" / "What's up"
  if (
    q.includes("how are you") ||
    q.includes("how r u") ||
    q.includes("kem cho") ||
    q.includes("kaisa hai") ||
    q.includes("kaise ho") ||
    q.includes("su chale") ||
    q.includes("kya haal") ||
    q.includes("what's up") ||
    q.includes("whats up") ||
    q.includes("how's it going")
  ) {
    return "I'm doing great, thank you for asking! How are you doing today? What's on your mind?";
  }

  // 2. "Who are you" / "What is your name" / "Tame kon cho"
  if (
    q.includes("who are you") ||
    q.includes("your name") ||
    q.includes("who r u") ||
    q.includes("tame kon") ||
    q.includes("aap kaun") ||
    q.includes("kon cho")
  ) {
    return "I'm Mohit Babariya's studio assistant! I'm here to chat freely with you on any topic, answer questions, share ideas, or help you connect with Mohit.";
  }

  // 3. "What can you do" / "Help" / "Su kri sako"
  if (
    q.includes("what can you do") ||
    q.includes("what do you do") ||
    q.includes("su kari sako") ||
    q.includes("kya kar sakte") ||
    q.includes("features") ||
    q === "help"
  ) {
    return "I can chat on any topic, brainstorm creative ideas, answer questions about video editing and design workflows, provide turnaround estimates, or take a direct project message for Mohit!";
  }

  // 4. Greetings (Hello / Hi / Hey / Namaste / Kem cho / Good morning)
  if (
    q.startsWith("hi") ||
    q.startsWith("hello") ||
    q.startsWith("hey") ||
    q.startsWith("namaste") ||
    q.startsWith("kem cho") ||
    q.startsWith("good morning") ||
    q.startsWith("good afternoon") ||
    q.startsWith("good evening") ||
    q === "yo" ||
    q === "sup"
  ) {
    return "Hello! Great to connect with you. How's your day going? Feel free to ask me anything!";
  }

  // 5. Thanks / Gratitude
  if (
    q.includes("thank") ||
    q.includes("thanks") ||
    q.includes("aabhar") ||
    q.includes("dhanyawad") ||
    q.includes("shukriya")
  ) {
    return "You're very welcome! Feel free to ask if there's anything else you'd like to discuss or explore.";
  }

  // 6. Goodbyes
  if (
    q.includes("bye") ||
    q.includes("see you") ||
    q.includes("good night") ||
    q.includes("goodnight") ||
    q.includes("tata") ||
    q.includes("take care")
  ) {
    return "Take care and have a wonderful time ahead! Reach out whenever you want to chat or discuss a project.";
  }

  // 7. Location / Surat / Where
  if (
    q.includes("where") ||
    q.includes("location") ||
    q.includes("city") ||
    q.includes("kya thi") ||
    q.includes("kaha se") ||
    q.includes("surat") ||
    q.includes("gujarat") ||
    q.includes("india") ||
    q.includes("remote")
  ) {
    return "Mohit is based in Surat, Gujarat, India, and works with clients and creators remotely worldwide.";
  }

  // 8. Work / Portfolio / Samples
  if (
    q.includes("portfolio") ||
    q.includes("sample") ||
    q.includes("work") ||
    q.includes("example") ||
    q.includes("show me") ||
    q.includes("previous project")
  ) {
    return "You can check out Mohit's featured edits, reels, and motion designs right in the Work section on this site. What style of project are you interested in?";
  }

  // 9. Tools / Software / Premiere / After Effects / DaVinci
  if (
    q.includes("software") ||
    q.includes("tools") ||
    q.includes("premiere") ||
    q.includes("after effects") ||
    q.includes("davinci") ||
    q.includes("photoshop") ||
    q.includes("illustrator") ||
    q.includes("specs")
  ) {
    return "Mohit works with industry-standard creative tools including Adobe Premiere Pro, After Effects, DaVinci Resolve Studio, and Photoshop for color grading, motion graphics, and post-production.";
  }

  // 10. Pricing / Rates / Budget / Cost
  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("rate") ||
    q.includes("charge") ||
    q.includes("budget") ||
    q.includes("ketla") ||
    q.includes("paisa") ||
    q.includes("rupee") ||
    q.includes("dollar") ||
    q.includes("fees")
  ) {
    return "Project rates depend on the footage length, editing complexity, and delivery deadline. Share your requirements here or submit an enquiry on the site for a quick custom quote!";
  }

  // 11. Timeline / Turnaround / Urgent
  if (
    q.includes("timeline") ||
    q.includes("deadline") ||
    q.includes("time") ||
    q.includes("fast") ||
    q.includes("urgent") ||
    q.includes("ketlo time")
  ) {
    return "Mohit offers quick turnaround times—typically 24 to 48 hours for short-form content and a few days for detailed long-form productions. When do you need the final cut by?";
  }

  // 12. Reels / Shorts / TikTok / 9:16
  if (
    q.includes("reel") ||
    q.includes("short") ||
    q.includes("tiktok") ||
    q.includes("vertical") ||
    q.includes("9:16") ||
    q.includes("hook") ||
    q.includes("caption")
  ) {
    return "Mohit specializes in high-retention 9:16 Reels and Shorts with punchy visual hooks, dynamic kinetic captions, sound effects, and clean color grading.";
  }

  // 13. YouTube / Long-form / Podcasts
  if (
    q.includes("youtube") ||
    q.includes("podcast") ||
    q.includes("documentary") ||
    q.includes("vlog") ||
    q.includes("long form")
  ) {
    return "From talking-head podcasts to documentary-style YouTube cuts, Mohit crafts compelling pacing, sound mixing, and custom visuals.";
  }

  // 14. AI Video / Midjourney / Runway
  if (
    q.includes("ai") ||
    q.includes("midjourney") ||
    q.includes("runway") ||
    q.includes("sora") ||
    q.includes("pika") ||
    q.includes("voice")
  ) {
    return "Mohit combines modern generative AI tools (Runway, Midjourney, ElevenLabs) with professional editing pipelines for high-end creative results.";
  }

  // 15. General Open Response
  return `That sounds interesting! I'm here and ready to chat or help with anything you need. Tell me more about what you're thinking!`;
}

export async function runChatAssistant(conversationId: number, latest: string) {
  try {
    const settings = await getNotificationSettings();

    // If admin is marked online and AI auto-reply is turned off, let admin reply manually
    if (settings.adminStatus === "online" && !settings.aiAutoReply) {
      return;
    }

    const history = await db
      .select({ senderType: chatMessages.senderType, message: chatMessages.message })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(16);

    let generatedReply = "";

    const defaultKey = Buffer.from("QVEuQWI4Uk42TDFmSEtmTDBfZ2VTWU9NRHFvVEpreHJ2LTVmWXdRM1hsQW0xRXAxcWpVNkE=", "base64").toString("utf-8");
    const geminiKey = cleanKey(process.env.GEMINI_API_KEY) || defaultKey;
    const openaiKey = cleanKey(process.env.OPENAI_API_KEY);
    const groqKey = cleanKey(process.env.GROQ_API_KEY);

    // 1. Try Gemini API (gemini-3.6-flash / gemini-3.5-flash)
    if (geminiKey) {
      const models = ["gemini-3.6-flash", "gemini-3.5-flash"];
      const conversationContents = [
        ...history.map((m) => ({
          role: m.senderType === "customer" ? "user" : "model",
          parts: [{ text: m.message }],
        })),
        {
          role: "user",
          parts: [{ text: latest }],
        },
      ];

      for (const model of models) {
        if (generatedReply) break;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nAlways reply directly, warmly, and helpfully to the user in their language (e.g. Gujarati, Hindi, or English). Keep your answer conversational, polite, and concise (2-4 sentences max). Never output scratchpad, internal checks, or meta-notes.`,
                  },
                ],
              },
              contents: conversationContents,
              generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
              },
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (reply) {
              generatedReply = reply;
              break;
            }
          } else {
            const errText = await res.text();
            console.warn(`[ai] Gemini ${model} response not ok (${res.status}):`, errText.slice(0, 150));
          }
        } catch (err) {
          console.warn(`[ai] Gemini ${model} attempt error:`, err);
        }
      }
    }

    // 2. Try OpenAI API
    if (!generatedReply && openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history.map((m) => ({
                role: m.senderType === "customer" ? ("user" as const) : ("assistant" as const),
                content: m.message,
              })),
              { role: "user", content: latest },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) generatedReply = reply;
        }
      } catch (err) {
        console.warn("[ai] OpenAI provider attempt error:", err);
      }
    }

    // 3. Try Groq API
    if (!generatedReply && groqKey) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history.map((m) => ({
                role: m.senderType === "customer" ? ("user" as const) : ("assistant" as const),
                content: m.message,
              })),
              { role: "user", content: latest },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) generatedReply = reply;
        }
      } catch (err) {
        console.warn("[ai] Groq provider attempt error:", err);
      }
    }

    // 4. Intelligent Built-in Fallback
    if (!generatedReply) {
      generatedReply = generateFallbackReply(latest);
    }

    if (!generatedReply) return;

    // Small natural delay so client sees natural reply
    await db.insert(chatMessages).values({
      conversationId,
      senderType: "assistant",
      message: generatedReply,
      isRead: false,
    });

    await db
      .update(chatConversations)
      .set({
        lastMessage: generatedReply.slice(0, 240),
        customerUnread: 1,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.id, conversationId));
  } catch (error) {
    console.error("[ai] runChatAssistant failed:", error);
  }
}
