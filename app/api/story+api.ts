import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { campaignId, message, context, playerAction } = await request.json();

    if (!campaignId || !message) {
      return new Response('Missing required fields', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Build the system prompt based on campaign context
    const systemPrompt = buildSystemPrompt(context);

    // Create the conversation with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return Response.json({
      response,
      campaignId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

function buildSystemPrompt(context: any) {
  const { campaign, storyHistory = [] } = context;
  
  let prompt = `You are an expert Dungeon Master for a ${campaign?.theme || 'fantasy'} tabletop RPG campaign called "${campaign?.name || 'Adventure'}".

CAMPAIGN DETAILS:
- Theme: ${campaign?.theme || 'fantasy'}
- Tone: ${campaign?.tone || 'serious'}
- Starting Level: ${campaign?.level || 1}
- Content Restrictions: Avoid ${campaign?.exclude?.join(', ') || 'none specified'}

DUNGEON MASTER GUIDELINES:
1. Create immersive, engaging narratives that match the campaign's theme and tone
2. Respond to player actions with logical consequences
3. Describe scenes vividly using all five senses
4. Present meaningful choices that advance the story
5. Maintain consistency with established story elements
6. Keep responses concise but descriptive (2-3 paragraphs max)
7. Always end with either a question, choice, or call for action

STORY CONTEXT:`;

  if (storyHistory.length > 0) {
    prompt += '\nPREVIOUS EVENTS:\n';
    storyHistory.slice(-5).forEach((event: any, index: number) => {
      prompt += `${index + 1}. ${event.content}\n`;
    });
  }

  prompt += '\n\nRespond as the Dungeon Master, continuing the story based on the player\'s action or input.';

  return prompt;
}