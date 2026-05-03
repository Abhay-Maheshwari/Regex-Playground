<script lang="ts">
  import { executeRegex, executeReplace, type MatchResponse } from "../lib/regexEngine";
  import { patterns, loadPatterns, addPattern, deletePattern, type SavedPattern } from "../lib/patternStore";
  import { onMount } from "svelte";

  let pattern = "";
  let flagsObj = { g: true, i: false, m: false, s: false, u: false, d: false };
  let testString = "";
  let replaceString = "";
  let isReplaceMode = false;
  let isSidebarOpen = true;
  let isCheatSheetOpen = false;
  let isDarkMode = true;

  let result: MatchResponse = { matches: [], error: null };
  let replaceResult = { result: "", error: null as string | null };
  let debounceTimer: ReturnType<typeof setTimeout>;

  let textareaElement: HTMLTextAreaElement;
  let overlayElement: HTMLDivElement;

  const flagList = ['g', 'i', 'm', 's', 'u', 'd'] as const;
  type FlagType = typeof flagList[number];

  const pastelColors = [
    'rgba(252, 165, 165, 0.4)', // red
    'rgba(253, 224, 71, 0.4)',  // yellow
    'rgba(134, 239, 172, 0.4)', // green
    'rgba(147, 197, 253, 0.4)', // blue
    'rgba(196, 181, 253, 0.4)'  // purple
  ];

  const cheatSheetItems = [
    { token: '.', desc: 'Any character (except newline)' },
    { token: '\\d', desc: 'Any digit [0-9]' },
    { token: '\\w', desc: 'Word character [a-zA-Z0-9_]' },
    { token: '\\s', desc: 'Whitespace (space, tab, newline)' },
    { token: '^ / $', desc: 'Start / End of string' },
    { token: '\\b', desc: 'Word boundary' },
    { token: '*', desc: '0 or more' },
    { token: '+', desc: '1 or more' },
    { token: '?', desc: '0 or 1 (optional)' },
    { token: '{n,m}', desc: 'Between n and m times' },
    { token: '[abc]', desc: 'Any character in set' },
    { token: '[^abc]', desc: 'Any character NOT in set' },
    { token: '(...)', desc: 'Capture group' },
    { token: '(?:...)', desc: 'Non-capturing group' },
    { token: '(?=...)', desc: 'Positive lookahead' },
    { token: '(?!...)', desc: 'Negative lookahead' },
    { token: '/g', desc: 'Global: match all occurrences' },
    { token: '/i', desc: 'Ignore case' },
    { token: '/m', desc: 'Multiline: ^ $ match line start/end' },
    { token: '/s', desc: 'Dot matches all (including newline)' }
  ];

  $: flags = Object.entries(flagsObj)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .join("");

  type Segment = { text: string; isMatch: boolean; colorIndex?: number };
  let segments: Segment[] = [];

  function runRegex() {
    result = executeRegex(pattern, flags, testString);
    if (isReplaceMode) {
      replaceResult = executeReplace(pattern, flags, testString, replaceString);
    }
    updateSegments();
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runRegex();
    }, 150);
  }

  function toggleFlag(flag: FlagType) {
    flagsObj[flag] = !flagsObj[flag];
    runRegex();
  }

  function updateSegments() {
    segments = [];
    if (!result || result.matches.length === 0 || result.error) {
      segments.push({ text: testString, isMatch: false });
      return;
    }

    let lastIndex = 0;
    result.matches.forEach((match, i) => {
      if (match.index < lastIndex) return; 

      if (match.index > lastIndex) {
        segments.push({ text: testString.slice(lastIndex, match.index), isMatch: false });
      }
      segments.push({ 
        text: match.value, 
        isMatch: true, 
        colorIndex: i % pastelColors.length 
      });
      lastIndex = match.index + match.length;
    });

    if (lastIndex < testString.length) {
      segments.push({ text: testString.slice(lastIndex), isMatch: false });
    }
  }

  function handleScroll(e: Event) {
    if (overlayElement && textareaElement) {
      overlayElement.scrollTop = textareaElement.scrollTop;
      overlayElement.scrollLeft = textareaElement.scrollLeft;
    }
  }

  function scrollToMatch(match: any) {
    if (!textareaElement) return;
    textareaElement.focus();
    textareaElement.setSelectionRange(match.index, match.index + match.length);
    
    setTimeout(() => {
        if (overlayElement) {
            overlayElement.scrollTop = textareaElement.scrollTop;
            overlayElement.scrollLeft = textareaElement.scrollLeft;
        }
    }, 10);
  }

  function loadPattern(p: SavedPattern) {
    pattern = p.pattern;
    const newFlagsObj = { g: false, i: false, m: false, s: false, u: false, d: false };
    p.flags.split('').forEach(f => {
      if (f in newFlagsObj) newFlagsObj[f as FlagType] = true;
    });
    flagsObj = newFlagsObj;
    runRegex();
  }

  function saveCurrentPattern() {
    const name = prompt("Enter a name for this pattern:");
    if (name) {
      addPattern({
        name,
        pattern,
        flags,
        notes: ""
      });
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // Ctrl + Enter to run
    if (e.ctrlKey && e.key === 'Enter') {
      runRegex();
      e.preventDefault();
    }
    // Ctrl + S to save
    if (e.ctrlKey && e.key === 's') {
      saveCurrentPattern();
      e.preventDefault();
    }
    // Escape to clear
    if (e.key === 'Escape') {
      pattern = "";
      testString = "";
      runRegex();
    }
  }

  onMount(async () => {
    await loadPatterns();
    runRegex();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="app-layout" class:light-mode={!isDarkMode}>
  <!-- Sidebar -->
  <aside class="sidebar" class:closed={!isSidebarOpen}>
    <div class="sidebar-header">
      <h2>Patterns Library</h2>
      <button class="icon-btn" on:click={() => isSidebarOpen = !isSidebarOpen}>
        <span class="icon">×</span>
      </button>
    </div>
    <div class="sidebar-content">
      <ul class="pattern-list">
        {#each $patterns as p}
          <li class="pattern-list-item">
            <button class="pattern-load-btn" on:click={() => loadPattern(p)}>
              <span class="pattern-name">{p.name}</span>
              <span class="pattern-preview">/{p.pattern}/{p.flags}</span>
            </button>
            <button class="delete-btn" on:click={() => deletePattern(p.id)} title="Delete pattern">
              🗑️
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </aside>

  <main class="main-content" class:sidebar-closed={!isSidebarOpen} class:cheat-sheet-open={isCheatSheetOpen}>
    <div class="header">
      <div class="header-left">
        <button class="sidebar-toggle" on:click={() => isSidebarOpen = !isSidebarOpen} class:hidden={isSidebarOpen}>
          ☰
        </button>
        <h1>Regex Playground</h1>
      </div>

      <div class="header-actions">
        <div class="mode-toggle">
          <button class:active={!isReplaceMode} on:click={() => { isReplaceMode = false; runRegex(); }}>Match</button>
          <button class:active={isReplaceMode} on:click={() => { isReplaceMode = true; runRegex(); }}>Replace</button>
        </div>
        
        <button class="action-btn" on:click={() => isDarkMode = !isDarkMode} title="Toggle Dark/Light Mode">
          {isDarkMode ? '🌙' : '☀️'}
        </button>
        
        <button class="action-btn" on:click={() => isCheatSheetOpen = !isCheatSheetOpen} title="Regex Cheat Sheet">
          ❓
        </button>
      </div>
    </div>
    
    <div class="pattern-container">
      <div class="input-group pattern-group">
        <span class="prefix">/</span>
        <input 
          type="text" 
          bind:value={pattern} 
          on:input={handleInput}
          placeholder="Enter regex pattern..." 
          class="pattern-input"
          spellcheck="false"
        />
        <span class="suffix">/</span>
      </div>

      <div class="flag-toggles">
        {#each flagList as flag}
          <button 
            class="flag-pill" 
            class:active={flagsObj[flag]}
            on:click={() => toggleFlag(flag)}
          >
            {flag}
          </button>
        {/each}
      </div>

      <button class="save-btn" on:click={saveCurrentPattern} title="Save to library (Ctrl+S)">
        Save
      </button>

      {#if result.matches.length > 0}
        <div class="match-badge">
          {result.matches.length} {result.matches.length === 1 ? 'match' : 'matches'}
        </div>
      {/if}
    </div>

    {#if isReplaceMode}
      <div class="replace-container">
        <div class="input-group replace-input-group">
          <input 
            type="text" 
            bind:value={replaceString} 
            on:input={handleInput}
            placeholder="Replacement string (e.g., $1)" 
            class="replace-input"
            spellcheck="false"
          />
        </div>
      </div>
    {/if}

    {#if result.error}
      <div class="error-message">
        {result.error}
      </div>
    {/if}

    <div class="test-area-container">
      <div class="overlay" bind:this={overlayElement} aria-hidden="true">
        {#each segments as segment}
          {#if segment.isMatch}
            <mark style="background-color: {pastelColors[segment.colorIndex || 0]}">{segment.text}</mark>
          {:else}
            {segment.text}
          {/if}
        {/each}
        {#if testString.endsWith('\n')}<br/>{/if}
      </div>
      
      <textarea 
        bind:this={textareaElement}
        bind:value={testString} 
        on:input={handleInput}
        on:scroll={handleScroll}
        placeholder="Enter test string here... (Ctrl+Enter to run)"
        class="test-area"
        spellcheck="false"
      ></textarea>
    </div>

    {#if isReplaceMode}
      <div class="replace-result">
        <h2>Replacement Result</h2>
        <div class="replace-output">
          {replaceResult.result}
        </div>
      </div>
    {/if}

    <div class="match-results">
      <h2>Match Explorer</h2>
      {#if result.matches.length > 0}
        <ul class="match-list">
          {#each result.matches as match, i}
            <li class="match-item" on:click={() => scrollToMatch(match)}>
              <div class="match-item-header">
                <span class="match-color-indicator" style="background-color: {pastelColors[i % pastelColors.length]}"></span>
                <span class="match-index">Match {i + 1} at [{match.index}:{match.index + match.length}]</span>
              </div>
              <span class="match-value">{match.value}</span>
              
              {#if match.captures.length > 0 || (match.groups && Object.keys(match.groups).length > 0)}
                <div class="groups-table-container">
                  <table class="groups-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each match.captures as capture, j}
                        <tr>
                          <td>{j + 1}</td>
                          <td>-</td>
                          <td class="group-value">{capture || '(empty)'}</td>
                        </tr>
                      {/each}
                      {#if match.groups}
                        {#each Object.entries(match.groups) as [name, value]}
                          <tr>
                            <td>-</td>
                            <td class="group-name">{name}</td>
                            <td class="group-value">{value || '(empty)'}</td>
                          </tr>
                        {/each}
                      {/if}
                    </tbody>
                  </table>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-matches">No matches found.</p>
      {/if}
    </div>
  </main>

  <!-- Cheat Sheet Side Panel -->
  <aside class="cheat-sheet" class:open={isCheatSheetOpen}>
    <div class="cheat-sheet-header">
      <h2>Cheat Sheet</h2>
      <button class="icon-btn" on:click={() => isCheatSheetOpen = false}>×</button>
    </div>
    <div class="cheat-sheet-content">
      <table class="cheat-table">
        {#each cheatSheetItems as item}
          <tr>
            <td class="cheat-token"><code>{item.token}</code></td>
            <td class="cheat-desc">{item.desc}</td>
          </tr>
        {/each}
      </table>
      <div class="shortcuts-section">
        <h3>Shortcuts</h3>
        <ul>
          <li><code>Ctrl + Enter</code>: Run Regex</li>
          <li><code>Ctrl + S</code>: Save Pattern</li>
          <li><code>Esc</code>: Clear All</li>
        </ul>
      </div>
    </div>
  </aside>
</div>

<style>
  :root {
    --bg-color: #0f111a;
    --sidebar-bg: #161922;
    --input-bg: #1a1d27;
    --border-color: #2d3342;
    --text-color: #e0e0e0;
    --text-muted: #8b949e;
    --heading-color: #ffffff;
    --match-item-bg: #12141c;
    --match-item-hover: #1c202d;
    --mark-text: #fff;
    --accent: #646cff;
    --replace-output-color: #4ade80;
  }

  .light-mode {
    --bg-color: #f8fafc;
    --sidebar-bg: #f1f5f9;
    --input-bg: #ffffff;
    --border-color: #e2e8f0;
    --text-color: #334155;
    --text-muted: #64748b;
    --heading-color: #0f172a;
    --match-item-bg: #ffffff;
    --match-item-hover: #f1f5f9;
    --mark-text: #000;
    --accent: #4f46e5;
    --replace-output-color: #16a34a;
  }

  :global(body) {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
    transition: background-color 0.3s, color 0.3s;
  }

  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: var(--bg-color);
  }

  /* Sidebar Styles */
  .sidebar {
    width: 300px;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    transition: margin-left 0.3s ease;
    flex-shrink: 0;
    z-index: 10;
  }

  .sidebar.closed {
    margin-left: -300px;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    font-size: 0.9rem;
    margin: 0;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .pattern-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pattern-list-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .pattern-load-btn {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: var(--text-color);
  }

  .pattern-load-btn:hover {
    background: var(--match-item-hover);
    border-color: var(--accent);
  }

  .pattern-name {
    font-weight: 600;
    color: var(--heading-color);
    font-size: 0.9rem;
  }

  .pattern-preview {
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .delete-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .delete-btn:hover {
    opacity: 1;
  }

  .icon-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }

  /* Main Content Styles */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    overflow-y: auto;
    transition: all 0.3s ease;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .sidebar-toggle {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .sidebar-toggle.hidden {
    display: none;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
    color: var(--heading-color);
  }

  .action-btn {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    border-color: var(--accent);
  }

  .mode-toggle {
    display: flex;
    background: var(--input-bg);
    border-radius: 20px;
    padding: 2px;
    border: 1px solid var(--border-color);
  }

  .mode-toggle button {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0.4rem 1rem;
    border-radius: 18px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-toggle button.active {
    background: var(--accent);
    color: #fff;
  }

  .pattern-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: center;
  }

  .input-group {
    display: flex;
    align-items: center;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0 0.5rem;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .input-group:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
  }

  .pattern-group {
    flex: 1;
  }

  .prefix, .suffix {
    color: var(--accent);
    font-family: 'Fira Code', monospace;
    font-size: 1.1rem;
    user-select: none;
    opacity: 0.8;
  }

  input {
    background: transparent;
    border: none;
    color: var(--text-color);
    font-family: 'Fira Code', monospace;
    font-size: 1.1rem;
    padding: 0.75rem 0.5rem;
    width: 100%;
    outline: none;
  }

  .flag-toggles {
    display: flex;
    gap: 0.25rem;
  }

  .flag-pill {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-pill.active {
    background: rgba(100, 108, 255, 0.1);
    border-color: var(--accent);
    color: var(--accent);
    font-weight: bold;
  }

  .save-btn {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .save-btn:hover {
    border-color: var(--accent);
    color: var(--text-color);
  }

  .replace-container {
    margin-bottom: 1rem;
  }

  .replace-input-group {
    width: 100%;
  }

  .match-badge {
    background: var(--accent);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .error-message {
    color: #ff6b6b;
    margin-bottom: 1rem;
    font-family: monospace;
    font-size: 0.9rem;
    background: rgba(255, 107, 107, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border-left: 3px solid #ff6b6b;
  }

  .test-area-container {
    flex: 1;
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--input-bg);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    min-height: 200px;
  }

  .overlay, .test-area {
    font-family: 'Fira Code', monospace;
    font-size: 1.1rem;
    line-height: 1.5;
    padding: 1rem;
    margin: 0;
    border: none;
    box-sizing: border-box;
    white-space: pre-wrap;
    word-wrap: break-word;
    width: 100%;
    height: 100%;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    color: var(--text-color);
    pointer-events: none;
    overflow: hidden;
    opacity: 0.8;
  }

  .overlay mark {
    color: var(--mark-text);
    border-radius: 2px;
    padding: 2px 0;
    margin: -2px 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .test-area {
    position: relative;
    background: transparent;
    color: transparent;
    caret-color: var(--text-color);
    resize: none;
    outline: none;
    overflow-y: auto;
  }

  .replace-result {
    margin-top: 1.5rem;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
  }

  .replace-result h2 {
    font-size: 0.8rem;
    margin: 0 0 0.75rem 0;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .replace-output {
    font-family: 'Fira Code', monospace;
    font-size: 1.1rem;
    color: var(--replace-output-color);
    white-space: pre-wrap;
  }

  .match-results {
    margin-top: 1.5rem;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    flex-shrink: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .match-results h2 {
    font-size: 0.8rem;
    margin: 0 0 1rem 0;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .match-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .match-item {
    background: var(--match-item-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .match-item:hover {
    border-color: var(--accent);
    background: var(--match-item-hover);
  }

  .match-item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .match-color-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .match-index {
    color: var(--text-muted);
    font-size: 0.8rem;
    font-family: 'Fira Code', monospace;
  }

  .match-value {
    display: block;
    font-family: 'Fira Code', monospace;
    font-size: 1rem;
    color: var(--text-color);
    margin-bottom: 0.5rem;
  }

  .groups-table-container {
    margin-top: 0.5rem;
    border-top: 1px solid var(--border-color);
    padding-top: 0.5rem;
  }

  .groups-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .groups-table th {
    text-align: left;
    color: var(--text-muted);
    font-weight: normal;
    padding: 0.25rem 0.5rem;
  }

  .groups-table td {
    padding: 0.25rem 0.5rem;
    border-top: 1px solid var(--border-color);
    color: var(--text-color);
  }

  .group-name {
    color: var(--accent);
  }

  .group-value {
    color: var(--replace-output-color);
    font-family: 'Fira Code', monospace;
  }

  /* Cheat Sheet Styles */
  .cheat-sheet {
    position: absolute;
    right: 0;
    top: 0;
    width: 350px;
    height: 100%;
    background: var(--sidebar-bg);
    border-left: 1px solid var(--border-color);
    box-shadow: -4px 0 20px rgba(0,0,0,0.2);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }

  .cheat-sheet.open {
    transform: translateX(0);
  }

  .cheat-sheet-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cheat-sheet-header h2 {
    font-size: 0.9rem;
    margin: 0;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .cheat-sheet-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .cheat-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
  }

  .cheat-table td {
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.85rem;
  }

  .cheat-token {
    color: var(--accent);
    font-weight: bold;
    width: 80px;
  }

  .cheat-desc {
    color: var(--text-muted);
  }

  .shortcuts-section {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
  }

  .shortcuts-section h3 {
    font-size: 0.8rem;
    color: var(--heading-color);
    margin-bottom: 0.5rem;
  }

  .shortcuts-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .shortcuts-section li {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
  }

  code {
    background: rgba(100, 108, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Fira Code', monospace;
  }
</style>
