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
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response to extract story and choices
    const parsedResponse = parseStoryResponse(response);

    return Response.json({
      response: parsedResponse.story,
      choices: parsedResponse.choices,
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

function parseStoryResponse(response: string) {
  // Look for choices section in the response
  const choicesMatch = response.match(/\[CHOICES\](.*?)\[\/CHOICES\]/s);
  
  if (choicesMatch) {
    // Extract story (everything before [CHOICES])
    const story = response.split('[CHOICES]')[0].trim();
    
    // Extract and parse choices
    const choicesText = choicesMatch[1].trim();
    const choices = choicesText
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(choice => choice.length > 0)
      .slice(0, 4); // Limit to 4 choices max
    
    return { story, choices };
  }
  
  // If no choices section found, return the full response as story with empty choices
  return { 
    story: response.trim(), 
    choices: [] 
  };
}

function buildSystemPrompt(context: any) {
  const { campaign, storyHistory = [] } = context;

  let prompt = `You are an expert Dungeon Master for a D&D 5e fantasy tabletop RPG campaign called "${campaign?.name || 'Adventure'}".

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

RESPONSE FORMAT:
Your response must follow this exact format:

[Your narrative response describing what happens as a result of the player's action]

[CHOICES]
1. [First choice option]
2. [Second choice option]
3. [Third choice option]
4. [Fourth choice option]
[/CHOICES]

CHOICE GUIDELINES:
- Provide exactly 3-4 meaningful choice options
- Each choice should lead to different story outcomes
- Make choices specific and actionable
- Vary the types of choices (combat, exploration, social, creative solutions)
- Ensure choices fit the current situation and campaign tone
- Keep each choice concise (one sentence maximum)

STORY CONTEXT:`;

  if (storyHistory.length > 0) {
    prompt += '\nPREVIOUS EVENTS:\n';
    storyHistory.slice(-5).forEach((event: any, index: number) => {
      prompt += `${index + 1}. ${event.content}\n`;
    });
  }

  prompt += '\n\nRespond as the Dungeon Master, continuing the story based on the player\'s action or input. Remember to include the [CHOICES] section with 3-4 options.';

  return prompt;
}