import { NextRequest } from 'next/server';

// Simple in-memory store for development (replace with proper database in production)
const conversations = new Map();

export async function POST(request: NextRequest) {
  try {
    console.log('Story API: Received request');
    
    const body = await request.json();
    console.log('Story API: Request body:', JSON.stringify(body, null, 2));
    
    const { campaignId, message, context, playerAction } = body;

    if (!campaignId || !message) {
      console.log('Story API: Missing required fields');
      return new Response('Missing required fields', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.log('Story API: Building system prompt');
    
    // Build the system prompt based on campaign context
    const systemPrompt = buildSystemPrompt(context);
    console.log('Story API: System prompt built, length:', systemPrompt.length);

    // For now, we'll return a mock response since OpenAI integration requires API keys
    // In production, you would use OpenAI here
    console.log('Story API: Generating mock response');
    
    const mockResponse = generateMockDMResponse(playerAction || message, context);
    console.log('Story API: Mock response generated:', mockResponse);

    return Response.json({
      response: mockResponse.story,
      choices: mockResponse.choices,
      campaignId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Story API: Error occurred:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

function generateMockDMResponse(playerAction: string, context: any) {
  console.log('Generating mock response for action:', playerAction);
  
  const campaign = context?.campaign;
  const storyHistory = context?.storyHistory || [];
  
  // Generate contextual story response based on player action
  let story = '';
  let choices = [];
  
  if (playerAction.toLowerCase().includes('forest') || playerAction.toLowerCase().includes('explore')) {
    story = `As you venture deeper into the ancient forest, the canopy above grows thicker, filtering the sunlight into dancing patterns on the forest floor. The air is filled with the scent of moss and old wood. Suddenly, you hear the snap of a twig behind you. You turn to see a pair of glowing eyes watching you from the shadows between the trees.`;
    choices = [
      'Approach the glowing eyes cautiously',
      'Call out to whatever is watching you',
      'Ready your weapon and prepare for combat',
      'Slowly back away while keeping eye contact'
    ];
  } else if (playerAction.toLowerCase().includes('camp') || playerAction.toLowerCase().includes('rest')) {
    story = `You find a small clearing surrounded by tall oak trees, their branches forming a natural shelter overhead. As you set up camp, you notice strange markings carved into the bark of the nearest tree - symbols that seem to pulse with a faint, otherworldly light. The fire crackles to life, casting long shadows that seem to move independently of the flames.`;
    choices = [
      'Investigate the strange markings on the tree',
      'Keep watch through the night',
      'Try to decipher the meaning of the symbols',
      'Move to a different camping spot'
    ];
  } else if (playerAction.toLowerCase().includes('listen') || playerAction.toLowerCase().includes('sound')) {
    story = `You stand perfectly still, straining your ears to catch any sound in the wilderness. At first, there's only the gentle rustle of leaves and distant bird calls. But then you hear it - a low, melodic humming that seems to come from everywhere and nowhere at once. The melody is hauntingly beautiful, yet fills you with an inexplicable sense of unease.`;
    choices = [
      'Follow the source of the humming',
      'Cover your ears and move away quickly',
      'Try to hum along with the melody',
      'Search for the origin of the sound'
    ];
  } else if (playerAction.toLowerCase().includes('civilization') || playerAction.toLowerCase().includes('search')) {
    story = `Your search leads you to what appears to be an old, overgrown path winding through the forest. Moss-covered stones mark what might have once been a road, and you can make out the remnants of ancient waymarkers. In the distance, you spot the crumbling remains of what looks like a watchtower, its stones blackened as if by some great fire long ago.`;
    choices = [
      'Follow the old path toward the watchtower',
      'Examine the waymarkers more closely',
      'Search the area for other signs of civilization',
      'Mark this location and continue exploring elsewhere'
    ];
  } else {
    // Generic response for other actions
    story = `Your action has consequences that ripple through the fabric of this mystical realm. The very air around you seems to shimmer with possibility as new paths reveal themselves. The ${campaign?.name || 'adventure'} continues to unfold in unexpected ways, and you sense that your choices here will shape the destiny of all who follow.`;
    choices = [
      'Press forward with determination',
      'Take a moment to assess the situation',
      'Look for alternative approaches',
      'Seek guidance from your companions'
    ];
  }
  
  console.log('Generated story length:', story.length);
  console.log('Generated choices count:', choices.length);
  
  return { story, choices };
}

function buildSystemPrompt(context: any) {
  const { campaign, storyHistory = [] } = context;

  let prompt = `You are an expert Dungeon Master for a D&D 5e fantasy tabletop RPG campaign called "${campaign?.name || 'Adventure'}".

CAMPAIGN DETAILS:
- Theme: ${campaign?.adventure || 'fantasy'}
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
      prompt += `${index + 1}. ${event.message || event.content}\n`;
    });
  }

  prompt += '\n\nRespond as the Dungeon Master, continuing the story based on the player\'s action or input. Remember to include the [CHOICES] section with 3-4 options.';

  return prompt;
}