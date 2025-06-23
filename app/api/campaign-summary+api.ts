export async function POST(request: Request) {
  try {
    const { campaignId, message, author, messageType, characterName } = await request.json();

    if (!campaignId || !message || !author || !messageType) {
      return new Response('Missing required fields', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Use the Node.js middleware service to add campaign summary
    const middlewareUrl = process.env.MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';

    const middlewareResponse = await fetch(`${middlewareUrl}/api/campaign/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        message,
        author,
        messageType,
        characterName
      }),
    });

    if (!middlewareResponse.ok) {
      throw new Error(`Middleware error: ${middlewareResponse.status}`);
    }

    const result = await middlewareResponse.json();

    return Response.json({
      success: true,
      summaries: result.summaries || []
    });

  } catch (error) {
    console.error('Campaign summary API error:', error);
    return Response.json({
      success: false,
      error: 'Failed to update campaign summary'
    }, { status: 500 });
  }
} 