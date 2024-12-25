import { mkdir, writeFile, access } from 'fs/promises';
import { dirname } from 'path';

// Directory structure to create
const directories = [
  'components/auth',
  'components/characters',
  'components/layout',
  'components/messages',
  'components/results',
  'components/search',
  'components/ui',
  'constants',
  'lib',
  'pages/api',
  'styles'
];

// File contents to generate
const files = {
  'components/auth/AuthSection.js': `import { Button } from '../ui/Button';
import { AUTH_ACTIONS } from '@/constants/auth';

export default function AuthSection({ isLoggedIn, onAuth, onLogout }) {
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {!isLoggedIn ? (
        <>
          <Button variant="accent" onClick={() => onAuth(AUTH_ACTIONS.SIGNUP)}>Sign Up</Button>
          <Button variant="secondary" onClick={() => onAuth(AUTH_ACTIONS.LOGIN)}>Login</Button>
        </>
      ) : (
        <Button onClick={onLogout}>Logout</Button>
      )}
    </div>
  );
}`,

  'components/layout/Container.js': `export default function Container({ children }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-white font-['Orbitron'] overflow-hidden">
      {children}
    </div>
  );
}`,

  'constants/auth.js': `export const AUTH_ACTIONS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  LINK_CHARACTER: 'link_character'
};

export const AUTH_MESSAGES = {
  SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  CHARACTER_LINKED: 'Character linked successfully!',
  EXISTS: 'Character already exists. Please login instead.',
  ERROR: 'An error occurred during authentication.'
};`,

  'pages/api/searchSystems.js': `export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemName } = req.query;

  if (!systemName) {
    return res.status(400).json({ error: 'System name is required' });
  }

  try {
    // TODO: Implement actual system search logic
    const mockResults = [
      { name: 'CynoMaster1', image: '/path-to-image1.jpg', shipType: 'Freighter', distance: 3 },
      { name: 'CynoExpert', image: '/path-to-image2.jpg', shipType: 'Jump Freighter', distance: 5 },
      { name: 'CynoGuy', image: '/path-to-image3.jpg', shipType: 'Battleship', distance: 7 },
    ];

    return res.status(200).json({ results: mockResults });
  } catch (error) {
    console.error('Search systems error:', error);
    return res.status(500).json({ error: 'Failed to search systems' });
  }
}`
};

// Helper function to check if file exists
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath) {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
}

// Main function to generate project structure
async function generateStructure() {
  try {
    // Create base directories first
    console.log('Creating directory structure...');
    for (const dir of directories) {
      await mkdir(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }

    // Create files
    console.log('\nGenerating files...');
    for (const [path, content] of Object.entries(files)) {
      try {
        const exists = await fileExists(path);
        if (exists) {
          console.log(`⚠️  File already exists, skipping: ${path}`);
          continue;
        }

        await ensureDirectoryExists(path);
        await writeFile(path, content);
        console.log(`✓ Created file: ${path}`);
      } catch (error) {
        console.error(`❌ Error creating file ${path}:`, error.message);
      }
    }

    console.log('\n✅ Project structure generation complete!');
  } catch (error) {
    console.error('\n❌ Error generating project structure:', error.message);
    process.exit(1);
  }
}

// Execute the script
generateStructure();