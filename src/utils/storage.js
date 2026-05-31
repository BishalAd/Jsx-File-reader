import localforage from 'localforage';

// Configure localForage database
localforage.config({
  name: 'JSXFileReader',
  storeName: 'jsx_files',
  description: 'Stores user JSX files for viewing and execution'
});

/**
 * Get all stored JSX files, sorted by updatedAt descending.
 */
export async function getFiles() {
  try {
    const keys = await localforage.keys();
    const files = [];
    for (const key of keys) {
      const file = await localforage.getItem(key);
      if (file && typeof file === 'object') {
        files.push(file);
      }
    }
    // Sort by updatedAt descending
    return files.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Error fetching files from storage:', error);
    return [];
  }
}

/**
 * Save or update a JSX file.
 * @param {Object} file - File object
 * @param {string} file.id - File unique ID (created if not exists)
 * @param {string} file.name - File name
 * @param {string} file.content - JSX code content
 * @param {Array<string>} file.tags - Array of tags
 */
export async function saveFile(file) {
  try {
    const id = file.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const existingFile = file.id ? await localforage.getItem(file.id) : null;
    const createdAt = existingFile ? existingFile.createdAt : now;

    const fileToSave = {
      id,
      name: file.name || 'Untitled.jsx',
      content: file.content || '',
      tags: file.tags || [],
      createdAt,
      updatedAt: now,
    };

    await localforage.setItem(id, fileToSave);
    return fileToSave;
  } catch (error) {
    console.error('Error saving file to storage:', error);
    throw error;
  }
}

/**
 * Delete a JSX file by ID.
 */
export async function deleteFile(id) {
  try {
    await localforage.removeItem(id);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get a specific JSX file by ID.
 */
export async function getFile(id) {
  try {
    return await localforage.getItem(id);
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}

/**
 * Seed dummy files if database is empty, to provide some initial examples for the user to play with.
 */
export async function seedInitialFiles() {
  const files = await getFiles();
  if (files.length > 0) return;

  const defaultFiles = [
    {
      name: 'InteractiveCounter.jsx',
      content: `// Interactive Counter Demo
// Try clicking the buttons to change the count and color theme!

function Counter() {
  const [count, setCount] = React.useState(0);
  const [theme, setTheme] = React.useState('emerald');

  const themes = {
    emerald: 'from-emerald-500 to-teal-600',
    indigo: 'from-indigo-500 to-purple-600',
    rose: 'from-rose-500 to-pink-600',
    amber: 'from-amber-500 to-orange-600'
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      maxWidth: '400px',
      margin: '20px auto',
      textAlign: 'center',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>
        Interactive Counter
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0' }}>
        A fully interactive component running locally.
      </p>

      <div style={{
        fontSize: '48px',
        fontWeight: '800',
        margin: '20px 0',
        textShadow: '0 0 10px rgba(255,255,255,0.2)'
      }}>
        {count}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => setCount(c => c - 1)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          - Decrement
        </button>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          + Increment
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0' }}>
          Change Color Accent:
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {Object.keys(themes).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: theme === t ? '2px solid #fff' : '2px solid transparent',
                background: t === 'emerald' ? '#10b981' : t === 'indigo' ? '#6366f1' : t === 'rose' ? '#f43f5e' : '#f59e0b',
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Export the component as the default export or global
// In our sandbox, we render whatever is returned/rendered, but if it has a default function, we can render it.
// Let's make it the default component to render:
render(<Counter />);
`,
      tags: ['Interactive', 'Counter', 'Demo'],
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'DynamicTabs.jsx',
      content: `// Dynamic Tab Component Demo
// Shows how you can manage nested state and complex interactivity

function DynamicTabs() {
  const [activeTab, setActiveTab] = React.useState('html');

  const content = {
    html: {
      title: 'HTML5 Structure',
      text: 'HTML provides the semantic skeleton of web pages. Use standard elements like <header>, <main>, <section>, and <footer> for better accessibility and SEO.',
      color: '#ef4444'
    },
    css: {
      title: 'CSS3 Styles',
      text: 'CSS brings style and life to web applications. Use custom properties (variables), grid, flexbox, and modern CSS frameworks to design gorgeous interactive UIs.',
      color: '#3b82f6'
    },
    js: {
      title: 'JavaScript Logic',
      text: 'JavaScript adds interactivity and logic. With modern APIs, ES modules, and async/await, JavaScript powers complex web apps that work smoothly on all devices.',
      color: '#eab308'
    }
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      color: '#f8fafc',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
        {Object.keys(content).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === tab ? '#fff' : '#94a3b8',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '13px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        borderLeft: \`4px solid \${content[activeTab].color}\`,
        minHeight: '120px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: content[activeTab].color }}>
          {content[activeTab].title}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>
          {content[activeTab].text}
        </p>
      </div>
    </div>
  );
}

render(<DynamicTabs />);
`,
      tags: ['Layout', 'Navigation', 'Interactive'],
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const file of defaultFiles) {
    await saveFile(file);
  }
}
