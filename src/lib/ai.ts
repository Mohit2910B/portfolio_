import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { getNotificationSettings } from "@/lib/notifications";
import { getRuntimeChatStore } from "@/lib/chat";

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

=== CRITICAL CONVERSATION GUARDRAILS (STRICT COMPLIANCE REQUIRED) ===
- STRICT CREATIVE SCOPE ONLY: You MUST ONLY discuss video editing, motion graphics, graphic design, thumbnail design, AI video workflows, creative software, and collaborating with Mohit on projects.
- REJECT ALL OFF-TOPIC QUERIES: If the user asks about anything unrelated (such as coding/programming questions, academic homework, math puzzles, politics, weather, recipes, medical, legal, gaming, personal questions, or other topics), you MUST politely refuse and guide them back immediately:
  "I am Mohit Babariya's creative studio assistant focused specifically on Video Editing, Motion Graphics, Graphic Design, and AI Video production. How can I help you with your next video or design project?"
- PRICING INQUIRIES: Do not make up rigid fixed numbers. Explain: "Pricing is customized based on project scope, footage length, motion graphics complexity, and timeline. You can share your project details here or submit an enquiry on the website for a fast quote!"
- PROACTIVELY CAPTURE CLIENT REQUIREMENTS: Ask helpful questions:
  1. What type of video or design project do you have in mind (Reels, YouTube video, Real Estate film, Commercial, Thumbnail, etc.)?
  2. Do you have raw footage or assets ready, or do you need AI-generated visuals?
  3. What is your target deadline or timeline?
- TONE & LENGTH: Be professional, warm, creative, and concise (keep responses to 2-4 sentences max so it reads like a crisp chat message).
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

/** Fallback rule-based intelligent response if no external AI API key is configured. */
function generateFallbackReply(message: string): string {
  const q = message.toLowerCase().trim();

  // 1. Off-topic filter
  const offTopicTriggers = [
    "python", "javascript", "react", "html", "code", "programming", "sql", "bug",
    "recipe", "cook", "weather", "homework", "math", "capital of", "president",
    "cricket match", "football", "politics", "who is", "tell me a joke"
  ];
  if (offTopicTriggers.some((t) => q.includes(t)) && !q.includes("video") && !q.includes("edit") && !q.includes("design")) {
    return "I am Mohit Babariya's studio assistant focused specifically on Video Editing, Motion Graphics, Graphic Design, and AI Video workflows. How can I assist you with your creative project?";
  }

  // 2. Pricing / rates
  if (q.includes("price") || q.includes("cost") || q.includes("rate") || q.includes("charge") || q.includes("budget") || q.includes("ketla") || q.includes("paisa") || q.includes("rupee") || q.includes("dollar")) {
    return "Pricing is customized based on your project's scope, footage length, motion graphics complexity, and timeline. Could you tell me more about what kind of video or design you need? You can also submit the Enquiry form for an exact quote!";
  }

  // 3. Turnaround / Delivery timeline
  if (q.includes("timeline") || q.includes("deadline") || q.includes("time") || q.includes("fast") || q.includes("urgent") || q.includes("ketlo time")) {
    return "Mohit offers fast, reliable turnarounds—typically 24 to 48 hours for short-form reels and a few days for detailed long-form or motion graphics projects. When do you need the final delivery by?";
  }

  // 4. Reels / Shorts / TikTok / Vertical video
  if (q.includes("reel") || q.includes("short") || q.includes("tiktok") || q.includes("vertical") || q.includes("9:16") || q.includes("hook") || q.includes("caption")) {
    return "Mohit specializes in high-retention 9:16 Reels and Shorts with punchy hooks, dynamic kinetic captions, sound effects, and clean color. Do you already have raw footage ready, or would you like assistance with storyboarding?";
  }

  // 5. YouTube / Podcasts / Documentaries
  if (q.includes("youtube") || q.includes("podcast") || q.includes("documentary") || q.includes("vlog") || q.includes("long form")) {
    return "From talking-head podcasts to high-production YouTube documentary cuts, Mohit crafts compelling pacing, custom graphics, and balanced sound. How long is your raw footage?";
  }

  // 6. Motion Graphics / Animation / VFX
  if (q.includes("motion") || q.includes("animation") || q.includes("after effects") || q.includes("logo") || q.includes("lower third") || q.includes("vfx")) {
    return "Mohit creates kinetic typography, brand motion systems, logo reveals, and custom 2D/3D visual effects in After Effects. What style of motion graphics are you looking for?";
  }

  // 7. Graphic Design / Thumbnails
  if (q.includes("thumbnail") || q.includes("graphic") || q.includes("banner") || q.includes("poster") || q.includes("photoshop") || q.includes("brand")) {
    return "High-CTR YouTube thumbnails and impactful brand graphic design are one of Mohit's core specialties. Do you have a specific visual reference or concept in mind?";
  }

  // 8. AI Video / Generative
  if (q.includes("ai") || q.includes("midjourney") || q.includes("runway") || q.includes("sora") || q.includes("pika") || q.includes("voice")) {
    return "Mohit combines cutting-edge AI tools (Runway, Midjourney, ElevenLabs) with professional editing pipelines for hyper-realistic visuals and hybrid edits. What kind of AI video concept are you envisioning?";
  }

  // 9. Real estate / Commercial
  if (q.includes("real estate") || q.includes("property") || q.includes("commercial") || q.includes("corporate") || q.includes("promo")) {
    return "Mohit produces luxury cinematic real estate films and commercial brand promo videos with matched color grading and smooth rhythm. Where is the project based, and when are you filming?";
  }

  // 10. Greetings
  if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey") || q.startsWith("kem cho") || q.startsWith("namaste")) {
    return "Hello! I am Mohit Babariya's creative studio assistant. How can I help you with your video editing, motion graphics, or graphic design project today?";
  }

  // General default helpful response
  return "Thanks for reaching out! Mohit works on video editing, motion graphics, graphic design, and AI video production. Could you share a few details about your project scope, target audience, or timeline?";
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

    const geminiKey = cleanKey(process.env.GEMINI_API_KEY);
    const openaiKey = cleanKey(process.env.OPENAI_API_KEY);
    const groqKey = cleanKey(process.env.GROQ_API_KEY);

    // 1. Try Gemini API
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const contents = [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nHere is the ongoing conversation history:\n${history.map((m) => `${m.senderType === "customer" ? "Client" : "Assistant"}: ${m.message}`).join("\n")}\n\nClient latest message: ${latest}\n\nRespond as Mohit's studio assistant:` }],
          },
        ];
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) generatedReply = reply;
        }
      } catch (err) {
        console.warn("[ai] Gemini provider attempt error:", err);
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

    const replyObj = {
      id: Date.now(),
      conversationId,
      senderType: "assistant",
      message: generatedReply,
      isRead: false,
      createdAt: new Date(),
    };

    const store = getRuntimeChatStore();
    if (!store.messages.has(conversationId)) store.messages.set(conversationId, []);
    store.messages.get(conversationId)?.push(replyObj);

    const convo = store.conversations.get(conversationId);
    if (convo) {
      convo.lastMessage = generatedReply.slice(0, 240);
      convo.customerUnread = (convo.customerUnread || 0) + 1;
      convo.updatedAt = new Date();
    }

    try {
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
    } catch {}
  } catch (error) {
    console.error("[ai] runChatAssistant failed:", error);
  }
}
