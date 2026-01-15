import type { Env } from './env'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  })
}

async function exchangeToken(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { code?: string; redirect_uri?: string }
    const { code, redirect_uri } = body

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'invalid_request', error_description: 'code and redirect_uri are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const clientId = env.GITHUB_CLIENT_ID
    const clientSecret = env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'server_error', error_description: 'GitHub credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ 
          error: errorData.error || 'token_exchange_failed', 
          error_description: errorData.error_description || 'Failed to exchange token' 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await response.json()
    
    return new Response(
      JSON.stringify(tokenData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'server_error', 
        error_description: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'KLS Token Exchange Worker' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (url.pathname === '/api/oauth/token' && request.method === 'POST') {
      return exchangeToken(request, env)
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}
