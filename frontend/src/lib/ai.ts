import OpenAI from 'openai';

const RECIPE_TIMEOUT_MS = 20_000;
const EXPIRY_TIMEOUT_MS = 8_000;

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timer) };
}

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  dangerouslyAllowBrowser: true // Since we are in frontend, but ideally this should be server-side
});

export async function generateRecipe(
  pantryItems: string[],
  expiringItems: string[],
  userMessage: string,
  dietaryPrefs: string[] = [],
  cuisinePrefs: string[] = [],
  cookingSkill: string = 'intermediate'
): Promise<ReadableStream> {
  const dietLine = dietaryPrefs.length > 0
    ? `\nDietary restrictions: ${dietaryPrefs.join(', ')}`
    : '';
  const cuisineLine = cuisinePrefs.length > 0
    ? `\nPreferred cuisines: ${cuisinePrefs.join(', ')}`
    : '';

  const { controller, clear } = createTimeoutController(RECIPE_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create({
      model: 'meta/llama-3.1-405b-instruct', // Using a powerful NVIDIA model
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef. Create a detailed recipe based on the provided ingredients and preferences. Respond in markdown format.'
        },
        {
          role: 'user',
          content: `Pantry items: ${pantryItems.join(', ')}\nExpiring soon: ${expiringItems.join(', ')}${dietLine}${cuisineLine}\nCooking skill: ${cookingSkill}\n\nAdditional request: ${userMessage}`
        }
      ],
      stream: true,
    }, { signal: controller.signal });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
        clear();
      },
      cancel() {
        clear();
        controller.abort();
      }
    });
  } catch (error) {
    clear();
    throw error;
  }
}
