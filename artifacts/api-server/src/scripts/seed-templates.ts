import { db } from "@workspace/db";
import { promptTemplatesTable } from "@workspace/db";

const templates = [
  {
    title: "Professional Email",
    titleHindi: "पेशेवर ईमेल",
    description: "Write a professional email for business communication",
    descriptionHindi: "व्यवसायिक संवाद के लिए पेशेवर ईमेल लिखें",
    prompt: "Write a professional email to [recipient] regarding [topic]. The email should be formal, concise, and include a clear subject line, proper greeting, main body with key points, and a professional closing. Tone: respectful and direct.",
    taskType: "chatgpt",
    category: "chatgpt",
    platform: "ChatGPT",
    usageCount: 120,
    tags: ["email", "business", "professional"],
  },
  {
    title: "Fantasy Landscape",
    titleHindi: "काल्पनिक परिदृश्य",
    description: "Create a stunning fantasy landscape image",
    descriptionHindi: "एक शानदार काल्पनिक परिदृश्य की छवि बनाएं",
    prompt: "epic fantasy landscape, ancient mystical forest with glowing trees, crystal clear river, floating islands in the sky, dramatic golden hour lighting, detailed matte painting style, 8k resolution, cinematic composition --ar 16:9 --v 6 --q 2",
    taskType: "image_midjourney",
    category: "image_midjourney",
    platform: "Midjourney",
    usageCount: 98,
    tags: ["fantasy", "landscape", "nature"],
  },
  {
    title: "Product Description",
    titleHindi: "उत्पाद विवरण",
    description: "Write compelling product descriptions for e-commerce",
    descriptionHindi: "ई-कॉमर्स के लिए आकर्षक उत्पाद विवरण लिखें",
    prompt: "Write a compelling product description for [product name]. Include: 1) An attention-grabbing headline, 2) Key features and benefits in bullet points, 3) Who this product is perfect for, 4) A persuasive call-to-action. Make it SEO-friendly and conversion-focused.",
    taskType: "writing",
    category: "writing",
    platform: "ChatGPT",
    usageCount: 87,
    tags: ["ecommerce", "marketing", "sales"],
  },
  {
    title: "Portrait Photography Style",
    titleHindi: "पोर्ट्रेट फोटोग्राफी शैली",
    description: "Generate photorealistic portrait images",
    descriptionHindi: "फोटो-रियलिस्टिक पोर्ट्रेट छवियां बनाएं",
    prompt: "A photorealistic portrait of [description], natural soft lighting from a window, shallow depth of field, 85mm lens, professional photography, high detail facial features, neutral background, award-winning photography",
    taskType: "image_dalle",
    category: "image_dalle",
    platform: "DALL-E",
    usageCount: 76,
    tags: ["portrait", "photography", "realistic"],
  },
  {
    title: "Code Review Assistant",
    titleHindi: "कोड समीक्षा सहायक",
    description: "Get detailed code review and improvements",
    descriptionHindi: "विस्तृत कोड समीक्षा और सुधार प्राप्त करें",
    prompt: "Please review the following [language] code for: 1) Bugs and potential errors, 2) Performance improvements, 3) Security vulnerabilities, 4) Code style and best practices, 5) Better alternative approaches. Provide specific suggestions with examples.\n\n[Paste your code here]",
    taskType: "coding",
    category: "coding",
    platform: "ChatGPT",
    usageCount: 65,
    tags: ["code", "review", "programming"],
  },
  {
    title: "Cinematic Video Scene",
    titleHindi: "सिनेमाई वीडियो दृश्य",
    description: "Create cinematic AI video prompts",
    descriptionHindi: "सिनेमाई AI वीडियो प्रॉम्प्ट बनाएं",
    prompt: "Cinematic aerial shot slowly descending over [location], golden hour lighting, dramatic clouds, camera slowly rotating, hyper-realistic 4K quality, professional cinematography, Dolby Vision HDR, 24fps film look",
    taskType: "video_ai",
    category: "video_ai",
    platform: "Sora/Runway",
    usageCount: 54,
    tags: ["video", "cinematic", "aerial"],
  },
  {
    title: "Business Plan",
    titleHindi: "व्यापार योजना",
    description: "Create a comprehensive business plan",
    descriptionHindi: "एक व्यापक व्यापार योजना बनाएं",
    prompt: "Create a detailed business plan for [business idea] including: Executive Summary, Market Analysis, Target Audience, Unique Value Proposition, Revenue Model, Marketing Strategy, Operational Plan, Financial Projections for 3 years, and Risk Assessment. Format it professionally.",
    taskType: "business",
    category: "business",
    platform: "ChatGPT",
    usageCount: 43,
    tags: ["startup", "planning", "strategy"],
  },
  {
    title: "Study Guide Creator",
    titleHindi: "अध्ययन गाइड निर्माता",
    description: "Create comprehensive study guides on any topic",
    descriptionHindi: "किसी भी विषय पर व्यापक अध्ययन गाइड बनाएं",
    prompt: "Create a comprehensive study guide for [topic/subject] that includes: 1) Key concepts and definitions, 2) Important formulas or rules, 3) Common examples, 4) Practice questions with answers, 5) Memory tips and mnemonics, 6) Summary table. Level: [beginner/intermediate/advanced]",
    taskType: "education",
    category: "education",
    platform: "ChatGPT",
    usageCount: 38,
    tags: ["study", "learning", "education"],
  },
  {
    title: "Short Story Opening",
    titleHindi: "लघु कहानी की शुरुआत",
    description: "Generate compelling story openings",
    descriptionHindi: "आकर्षक कहानी की शुरुआत बनाएं",
    prompt: "Write a compelling opening paragraph for a [genre] short story about [theme/plot]. The opening should: hook the reader immediately, establish the setting and mood, introduce the protagonist with a unique voice, create intrigue or tension, and make the reader want to continue. Style: [descriptive/minimalist/literary]",
    taskType: "creative",
    category: "creative",
    platform: "ChatGPT",
    usageCount: 29,
    tags: ["story", "fiction", "creative writing"],
  },
  {
    title: "Anime Character Art",
    titleHindi: "एनिमे किरदार कला",
    description: "Create anime-style character illustrations",
    descriptionHindi: "एनिमे शैली में किरदार चित्र बनाएं",
    prompt: "anime character, [description], detailed anime art style, soft lighting, vibrant colors, high quality illustration, professional anime key visual, clean linework, beautiful shading, 8k",
    taskType: "image_stable_diffusion",
    category: "image_stable_diffusion",
    platform: "Stable Diffusion",
    usageCount: 22,
    tags: ["anime", "character", "illustration"],
  },
];

async function seed() {
  const existing = await db.select().from(promptTemplatesTable).limit(1);
  if (existing.length > 0) {
    return;
  }

  await db.insert(promptTemplatesTable).values(templates);
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
