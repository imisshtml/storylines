// Story API now uses Node.js middleware for enhanced multiplayer D&D functionality
// Direct OpenAI integration has been moved to the middleware service

export async function POST(request: Request) {
  try {
    const { campaignId, message, context, playerAction, characterId, playerId } = await request.json();

    if (!campaignId || !message) {
      return new Response('Missing required fields', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (!playerId) {
      return Response.json({
        response: "You need to be logged in to play. Please sign in and try again.",
        choices: ["Sign in to continue"],
        campaignId,
        timestamp: new Date().toISOString(),
        error: 'Player ID required',
        success: false
      }, { status: 401 });
    }

    // Use the Node.js middleware service instead of direct OpenAI calls
    const middlewareUrl = process.env.MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';

    console.log('📤 Sending to middleware:', {
      campaignId,
      playerId,
      actionType: inferActionType(message),
      middlewareUrl
    });

    const middlewareResponse = await fetch(`${middlewareUrl}/api/game/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        playerId, // Using the player ID passed from the client
        characterId: characterId || null,
        action: message,
        actionType: inferActionType(message),
        metadata: {
          context,
          playerAction,
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (!middlewareResponse.ok) {
      const errorText = await middlewareResponse.text();
      console.error('Middleware error:', errorText);

      // Fallback to basic response for backward compatibility
      return Response.json({
        response: "I'm having trouble processing your request right now. Please try again.",
        choices: [
          "Try a different approach",
          "Wait and try again",
          "Continue with the story",
          "Ask for help"
        ],
        campaignId,
        timestamp: new Date().toISOString(),
        error: 'Middleware unavailable'
      });
    }

    const middlewareResult = await middlewareResponse.json();

    if (!middlewareResult.success) {
      throw new Error(middlewareResult.error || 'Middleware request failed');
    }

    // Use the actual middleware response structure
    const { response, choices, gameState } = middlewareResult;

    // Return the enhanced response from middleware
    return Response.json({
      response: response, // This is the narrative text
      choices: choices || [],
      campaignId,
      timestamp: new Date().toISOString(),
      gameState: {
        mode: gameState?.mode,
        scene: gameState?.scene?.title,
        playersOnline: gameState?.playerStates ? Object.keys(gameState.playerStates).length : 0
      },
      diceResults: [], // Not provided in current middleware response
      modeTransition: null, // Not provided in current middleware response
      success: true
    });

  } catch (error) {
    console.error('Story API error:', error);

    // Enhanced error handling - try to provide a meaningful response even on error
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return Response.json({
      response: `Something went wrong: ${errorMessage}. Let's continue the adventure anyway!`,
      choices: [
        "Try a different action",
        "Continue exploring",
        "Rest and recover",
        "Ask the DM for guidance"
      ],
      campaignId: null,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      success: false
    });
  }
}

// Helper function to infer action type from message content
function inferActionType(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Handle initial story generation
  if (message === 'INITIAL_STORY_GENERATION' || lowerMessage.includes('initial story') || lowerMessage.includes('generate initial')) {
    return 'initial_story';
  }

  if (lowerMessage.includes('attack') || lowerMessage.includes('strike') || lowerMessage.includes('hit')) {
    return 'attack';
  }
  if (lowerMessage.includes('cast') || lowerMessage.includes('spell') || lowerMessage.includes('magic')) {
    return 'spell';
  }
  if (lowerMessage.includes('persuade') || lowerMessage.includes('convince') || lowerMessage.includes('talk') || lowerMessage.includes('negotiate')) {
    return 'social';
  }
  if (lowerMessage.includes('move') || lowerMessage.includes('go') || lowerMessage.includes('walk') || lowerMessage.includes('run')) {
    return 'movement';
  }
  if (lowerMessage.includes('search') || lowerMessage.includes('look') || lowerMessage.includes('examine') || lowerMessage.includes('investigate')) {
    return 'exploration';
  }
  if (lowerMessage.includes('use') || lowerMessage.includes('drink') || lowerMessage.includes('eat') || lowerMessage.includes('activate')) {
    return 'item';
  }
  if (lowerMessage.includes('rest') || lowerMessage.includes('sleep') || lowerMessage.includes('recover')) {
    return 'rest';
  }
  if (lowerMessage.includes('hide') || lowerMessage.includes('sneak') || lowerMessage.includes('stealth')) {
    return 'stealth';
  }

  return 'other';
}