// pages/api/auth.js
export default function handler(req, res) {
  // Add logging for debugging
  console.log('Auth handler called:', { 
    method: req.method,
    query: req.query,
    cookies: req.cookies 
  });

  const clientId = process.env.EVE_CLIENT_ID;
  if (!clientId) {
    console.error('EVE_CLIENT_ID not configured');
    return res.redirect('/?auth=error&message=' + encodeURIComponent('EVE client configuration missing'));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`;
  
  const scopes = [
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-skills.read_skills.v1',
    'esi-clones.read_clones.v1',
    'esi-universe.read_structures.v1',
    'esi-location.read_online.v1'
  ].join(' ');

  // Get the current user's global ID from the cookie
  const userContext = req.cookies.user_context;
  const action = req.query.action || 'login';
  const characterId = req.query.characterId;

  console.log('Processing auth request:', { action, userContext, characterId });
  
  const stateData = {
    nonce: require('crypto').randomBytes(16).toString('hex'),
    action: action,
    currentUser: action === 'link_character' ? userContext : null,
    characterId: action === 'reauth' ? characterId : null
  };
  
  console.log('Setting state data:', stateData);
  
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  // Set cookie with proper attributes
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600 // 1 hour
  };

  res.setHeader(
    'Set-Cookie',
    `auth_state=${state}; ${Object.entries(cookieOptions)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}`
  );

  const loginUrl = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;

  console.log('Redirecting to:', loginUrl);
  res.redirect(loginUrl);
}